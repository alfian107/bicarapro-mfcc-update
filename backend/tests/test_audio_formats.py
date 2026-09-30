"""Format-coverage tests for POST /api/analyses.

Verifies that after ffmpeg install, librosa/audioread can decode non-WAV containers
that browsers/mobile produce: webm/opus (web MediaRecorder), m4a/aac (iOS/Android),
mp3. WAV is regression-tested separately in test_bicarapro_api.py.
"""
import os
import subprocess
import pytest
from conftest import API, auth_headers


def _synth(ext: str, codec: str, extra: list = None, out_dir: str = "/tmp") -> str:
    """Generate a 3s sine tone via ffmpeg in the given container/codec."""
    path = os.path.join(out_dir, f"test_fmt.{ext}")
    if os.path.exists(path):
        os.remove(path)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", "sine=frequency=220:duration=3",
        "-c:a", codec,
    ]
    if extra:
        cmd += extra
    cmd += [path]
    subprocess.run(cmd, check=True, capture_output=True)
    assert os.path.getsize(path) > 100, f"ffmpeg produced empty {ext}"
    return path


@pytest.fixture(scope="module")
def webm_path():
    return _synth("webm", "libopus", ["-b:a", "32k"])


@pytest.fixture(scope="module")
def m4a_path():
    return _synth("m4a", "aac", ["-b:a", "64k"])


@pytest.fixture(scope="module")
def mp3_path():
    return _synth("mp3", "libmp3lame", ["-b:a", "64k"])


def _upload(http, token, path: str, mime: str, title: str):
    fname = os.path.basename(path)
    with open(path, "rb") as f:
        files = {"file": (fname, f, mime)}
        r = http.post(f"{API}/analyses?title={title}",
                      headers=auth_headers(token), files=files, timeout=180)
    return r


def _assert_full_analysis(j: dict):
    for k in ["id", "mfcc_mean", "mfcc_std", "intonation_score", "clarity_score",
              "overall_score", "transcript", "ai_feedback", "duration_seconds",
              "pitch_mean", "pitch_std"]:
        assert k in j, f"missing field {k}"
    assert isinstance(j["mfcc_mean"], list) and len(j["mfcc_mean"]) == 13
    assert isinstance(j["mfcc_std"], list) and len(j["mfcc_std"]) == 13
    assert 0.0 <= j["intonation_score"] <= 100.0
    assert 0.0 <= j["clarity_score"] <= 100.0
    assert 0.0 <= j["overall_score"] <= 100.0
    assert isinstance(j["ai_feedback"], str) and len(j["ai_feedback"]) > 0
    assert isinstance(j["transcript"], str)
    assert j["duration_seconds"] > 2.5


class TestAudioFormats:
    """Non-WAV containers must decode via ffmpeg backend."""

    def test_webm_opus_upload(self, http, siswa_token, webm_path):
        r = _upload(http, siswa_token, webm_path, "audio/webm;codecs=opus", "TEST_webm")
        assert r.status_code == 200, f"webm failed: {r.status_code} {r.text[:400]}"
        _assert_full_analysis(r.json())

    def test_m4a_aac_upload(self, http, siswa_token, m4a_path):
        r = _upload(http, siswa_token, m4a_path, "audio/m4a", "TEST_m4a")
        assert r.status_code == 200, f"m4a failed: {r.status_code} {r.text[:400]}"
        _assert_full_analysis(r.json())

    def test_mp3_upload(self, http, siswa_token, mp3_path):
        r = _upload(http, siswa_token, mp3_path, "audio/mpeg", "TEST_mp3")
        assert r.status_code == 200, f"mp3 failed: {r.status_code} {r.text[:400]}"
        _assert_full_analysis(r.json())
