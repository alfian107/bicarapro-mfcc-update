"""Tests for MFCC pipeline display fields (mfcc_pipeline, viz, score_breakdown)."""
import io
import os
import numpy as np
import soundfile as sf
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://15294687-00c7-447d-88e1-64d67d7ad3da.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _wav_bytes(seconds=3.0, sr=22050):
    t = np.linspace(0, seconds, int(sr * seconds), endpoint=False)
    # sweep-ish + harmonic to produce non-trivial pitch variability
    freq = 180 + 60 * np.sin(2 * np.pi * 0.5 * t) + 20 * t
    sig = 0.3 * np.sin(2 * np.pi * freq * t) + 0.12 * np.sin(2 * np.pi * 2 * freq * t)
    buf = io.BytesIO()
    sf.write(buf, sig.astype(np.float32), sr, format="WAV")
    return buf.getvalue()


@pytest.fixture(scope="module")
def siswa_token():
    r = requests.post(f"{API}/auth/login", json={"email": "siswa@smkbinaguna.sch.id", "password": "siswa123"}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def guru_token():
    r = requests.post(f"{API}/auth/login", json={"email": "guru@smkbinaguna.sch.id", "password": "guru123"}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def new_analysis(siswa_token):
    files = {"file": ("mfcc_test.wav", _wav_bytes(3.0), "audio/wav")}
    data = {"title": "TEST_MFCC_Pipeline"}
    r = requests.post(
        f"{API}/analyses",
        headers={"Authorization": f"Bearer {siswa_token}"},
        files=files, data=data, timeout=180,
    )
    assert r.status_code == 200, f"POST failed {r.status_code}: {r.text[:500]}"
    return r.json()


class TestMfccPipelineCreation:
    def test_response_has_new_fields(self, new_analysis):
        for k in ("mfcc_pipeline", "viz", "score_breakdown"):
            assert k in new_analysis, f"missing {k}"

    def test_pipeline_has_7_stages(self, new_analysis):
        p = new_analysis["mfcc_pipeline"]
        assert p["n_mfcc"] == 13
        stages = p["stages"]
        assert len(stages) == 7
        keys = [s["key"] for s in stages]
        assert keys == ["pre_emphasis", "framing", "windowing", "fft", "mel_filterbank", "log", "dct"]
        for s in stages:
            assert s.get("name")
            assert s.get("desc")
            assert s.get("params")
        # stages that must have real sample arrays + stats
        for key in ("pre_emphasis", "windowing", "fft", "mel_filterbank", "log", "dct"):
            st = next(s for s in stages if s["key"] == key)
            assert st["stats"] and set(st["stats"].keys()) == {"min", "max", "mean"}
            assert isinstance(st["sample"], list) and len(st["sample"]) > 0
            assert all(isinstance(v, (int, float)) for v in st["sample"])
        # DCT should give 13 sample values
        dct = next(s for s in stages if s["key"] == "dct")
        assert len(dct["sample"]) == 13

    def test_viz_structures(self, new_analysis):
        viz = new_analysis["viz"]
        wf = viz["waveform"]
        assert wf["sr"] == 22050
        assert len(wf["min"]) == len(wf["max"])
        assert 2 <= len(wf["min"]) <= 400
        sp = viz["spectrum"]
        assert 0 < len(sp["db"]) <= 128
        assert sp["fmin"] == 0.0 and sp["fmax"] == 22050 / 2
        hm = viz["heatmap"]
        assert hm["rows"] == 13
        assert 1 <= hm["cols"] <= 96
        assert len(hm["values"]) == 13
        assert all(len(row) == hm["cols"] for row in hm["values"])
        assert hm["frame_ms"] > 0 and hm["total_frames"] > 0

    def test_score_breakdown(self, new_analysis):
        sb = new_analysis["score_breakdown"]
        intn = sb["intonation"]
        assert "formula" in intn and "σ_pitch" in intn["formula"]
        assert isinstance(intn["inputs"], list) and len(intn["inputs"]) >= 3
        assert isinstance(intn["substitution"], str) and len(intn["substitution"]) > 0
        assert 0 <= float(intn["score"]) <= 100
        # rounded to 1 decimal
        assert round(float(intn["score"]), 1) == float(intn["score"])
        clr = sb["clarity"]
        assert "0.45" in clr["formula"] and "0.40" in clr["formula"] and "0.15" in clr["formula"]
        assert len(clr["inputs"]) == 3
        for inp in clr["inputs"]:
            assert "detail" in inp and inp["detail"]
        assert 0 <= float(clr["score"]) <= 100


class TestMfccPipelinePersistence:
    def test_get_by_id_returns_same_fields(self, siswa_token, new_analysis):
        aid = new_analysis["id"]
        r = requests.get(f"{API}/analyses/{aid}", headers={"Authorization": f"Bearer {siswa_token}"}, timeout=30)
        assert r.status_code == 200
        got = r.json()
        for k in ("mfcc_pipeline", "viz", "score_breakdown"):
            assert k in got and got[k] is not None
        assert len(got["mfcc_pipeline"]["stages"]) == 7
        assert got["viz"]["heatmap"]["rows"] == 13
        # Score numbers persisted
        assert got["score_breakdown"]["intonation"]["score"] == new_analysis["score_breakdown"]["intonation"]["score"]
        assert got["score_breakdown"]["clarity"]["score"] == new_analysis["score_breakdown"]["clarity"]["score"]


class TestLegacyAnalysisRegression:
    def test_legacy_analysis_still_returns_200(self, siswa_token):
        r = requests.get(f"{API}/analyses/history", headers={"Authorization": f"Bearer {siswa_token}"}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        # find any analysis (list endpoint returns summaries); fetch each detail
        legacy_id = None
        for it in items:
            aid = it.get("id")
            d = requests.get(f"{API}/analyses/{aid}", headers={"Authorization": f"Bearer {siswa_token}"}, timeout=30)
            assert d.status_code == 200, f"legacy {aid} failed"
            body = d.json()
            if body.get("mfcc_pipeline") is None:
                legacy_id = aid
                # ensure basic core fields are still there
                assert "overall_score" in body
                assert "intonation_score" in body
                break
        # It's OK if none are legacy (all have pipeline); just prove no 500s.
        # If legacy exists, mfcc_pipeline/viz/score_breakdown should be None/absent.
        if legacy_id:
            d = requests.get(f"{API}/analyses/{legacy_id}", headers={"Authorization": f"Bearer {siswa_token}"}, timeout=30).json()
            assert d.get("mfcc_pipeline") in (None,)


class TestGuruCanReadPipeline:
    def test_guru_gets_siswa_analysis_with_pipeline(self, guru_token, new_analysis):
        aid = new_analysis["id"]
        r = requests.get(f"{API}/analyses/{aid}", headers={"Authorization": f"Bearer {guru_token}"}, timeout=30)
        assert r.status_code == 200
        assert r.json().get("mfcc_pipeline") is not None
