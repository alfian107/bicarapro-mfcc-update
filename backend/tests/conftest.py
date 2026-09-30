import os
import pytest
import requests
import numpy as np
import soundfile as sf

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://voice-record-debug.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_base():
    return API


@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


@pytest.fixture(scope="session")
def guru_token(http):
    r = http.post(f"{API}/auth/login", json={"email": "guru@smkbinaguna.sch.id", "password": "guru123"}, timeout=30)
    assert r.status_code == 200, f"guru login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def siswa_token(http):
    r = http.post(f"{API}/auth/login", json={"email": "siswa@smkbinaguna.sch.id", "password": "siswa123"}, timeout=30)
    assert r.status_code == 200, f"siswa login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def wav_path(tmp_path_factory):
    p = tmp_path_factory.mktemp("audio") / "test.wav"
    sr = 22050
    t = np.linspace(0, 3, sr * 3, endpoint=False)
    freq = 180 + 40 * np.sin(2 * np.pi * 0.6 * t)
    signal = 0.3 * np.sin(2 * np.pi * freq * t) + 0.15 * np.sin(2 * np.pi * 2 * freq * t)
    sf.write(str(p), signal, sr)
    return str(p)


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}
