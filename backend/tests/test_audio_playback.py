"""Tests for the audio playback / streaming endpoint added in iteration 4.

Covers:
- POST /api/analyses now returns audio_url + audio_mime
- GET /api/analyses/{id} returns audio_url when audio is persisted
- GET /api/analyses/{id}/audio?token=... auth (missing/invalid/valid)
- Owner-only for siswa, guru can read any student's audio
- 404 for unknown id
- Bytes returned equal the uploaded bytes
- History endpoint response shape regression
"""
import io
import hashlib
import uuid
import requests
from conftest import API, auth_headers


def _upload(http, token, wav_path, title="TEST Audio Playback"):
    with open(wav_path, "rb") as f:
        raw = f.read()
    files = {"file": ("test.wav", io.BytesIO(raw), "audio/wav")}
    r = http.post(f"{API}/analyses?title={title.replace(' ', '%20')}",
                  headers=auth_headers(token), files=files, timeout=180)
    return r, raw


class TestAudioPlaybackEndpoint:
    """Verify audio persistence + streaming endpoint."""

    analysis_id = None
    other_analysis_id = None
    uploaded_sha = None
    other_token = None

    def test_create_analysis_returns_audio_url(self, http, siswa_token, wav_path):
        r, raw = _upload(http, siswa_token, wav_path)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "audio_url" in j, "response missing audio_url"
        assert j["audio_url"] is not None
        assert j["audio_url"].startswith("/api/analyses/") and j["audio_url"].endswith("/audio"), j["audio_url"]
        assert "audio_mime" in j and j["audio_mime"]
        TestAudioPlaybackEndpoint.analysis_id = j["id"]
        TestAudioPlaybackEndpoint.uploaded_sha = hashlib.sha256(raw).hexdigest()
        TestAudioPlaybackEndpoint.uploaded_bytes_len = len(raw)

    def test_get_analysis_includes_audio_url(self, http, siswa_token):
        assert TestAudioPlaybackEndpoint.analysis_id
        r = http.get(f"{API}/analyses/{TestAudioPlaybackEndpoint.analysis_id}",
                     headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert j.get("audio_url") == f"/api/analyses/{TestAudioPlaybackEndpoint.analysis_id}/audio"

    def test_audio_endpoint_missing_token(self, http):
        assert TestAudioPlaybackEndpoint.analysis_id
        r = http.get(f"{API}/analyses/{TestAudioPlaybackEndpoint.analysis_id}/audio", timeout=30)
        assert r.status_code == 401, r.text

    def test_audio_endpoint_invalid_token(self, http):
        assert TestAudioPlaybackEndpoint.analysis_id
        r = http.get(
            f"{API}/analyses/{TestAudioPlaybackEndpoint.analysis_id}/audio",
            params={"token": "not.a.jwt"},
            timeout=30,
        )
        assert r.status_code == 401, r.text

    def test_audio_endpoint_valid_token_returns_bytes(self, http, siswa_token):
        assert TestAudioPlaybackEndpoint.analysis_id
        r = http.get(
            f"{API}/analyses/{TestAudioPlaybackEndpoint.analysis_id}/audio",
            params={"token": siswa_token},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        # Bytes must equal the original upload byte-for-byte
        assert len(r.content) == TestAudioPlaybackEndpoint.uploaded_bytes_len
        assert hashlib.sha256(r.content).hexdigest() == TestAudioPlaybackEndpoint.uploaded_sha
        ct = r.headers.get("content-type", "")
        assert "audio" in ct.lower() or "octet" in ct.lower(), f"unexpected content-type: {ct}"

    def test_audio_endpoint_404_unknown_id(self, http, siswa_token):
        r = http.get(
            f"{API}/analyses/{uuid.uuid4().hex}/audio",
            params={"token": siswa_token},
            timeout=30,
        )
        assert r.status_code == 404, r.text

    def test_audio_endpoint_403_other_siswa(self, http, siswa_token, wav_path):
        # Register second siswa, upload, then try to fetch with original siswa's token
        email = f"other_audio_{uuid.uuid4().hex[:8]}@example.com"
        reg = http.post(f"{API}/auth/register",
                        json={"email": email, "password": "pass123",
                              "name": "TEST Other Audio Siswa", "role": "siswa",
                              "kelas": "XI-TKJ"},
                        timeout=30)
        assert reg.status_code == 200
        other_token = reg.json()["access_token"]
        TestAudioPlaybackEndpoint.other_token = other_token

        up, _raw = _upload(http, other_token, wav_path, title="OtherAudio")
        assert up.status_code == 200, up.text
        other_id = up.json()["id"]
        TestAudioPlaybackEndpoint.other_analysis_id = other_id
        assert up.json().get("audio_url")

        # Original siswa should get 403
        r = http.get(
            f"{API}/analyses/{other_id}/audio",
            params={"token": siswa_token},
            timeout=30,
        )
        assert r.status_code == 403, r.text

    def test_audio_endpoint_guru_can_read_any(self, http, guru_token):
        assert TestAudioPlaybackEndpoint.analysis_id
        r = http.get(
            f"{API}/analyses/{TestAudioPlaybackEndpoint.analysis_id}/audio",
            params={"token": guru_token},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        assert len(r.content) > 0

    def test_history_shape_regression(self, http, siswa_token):
        """History summary must NOT contain audio_url/transcript (unchanged shape)."""
        r = http.get(f"{API}/analyses/history", headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1
        expected_keys = {"id", "user_id", "user_name", "title", "intonation_score",
                        "clarity_score", "overall_score", "duration_seconds", "created_at"}
        row = rows[0]
        assert expected_keys <= set(row.keys()), f"missing keys: {expected_keys - set(row.keys())}"
        # Regression: history should be summary only (no audio_url, no transcript)
        assert "audio_url" not in row, "history row unexpectedly contains audio_url"
        assert "transcript" not in row, "history row unexpectedly contains transcript"
        assert "ai_feedback" not in row, "history row unexpectedly contains ai_feedback"
