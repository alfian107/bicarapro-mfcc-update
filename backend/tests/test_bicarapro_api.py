"""BicaraPro backend integration tests."""
import uuid
import requests
from conftest import API, auth_headers


# ---------- health ----------
def test_health_root(http):
    r = http.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"


# ---------- auth ----------
class TestAuth:
    def test_login_siswa_valid(self, http):
        r = http.post(f"{API}/auth/login", json={"email": "siswa@smkbinaguna.sch.id", "password": "siswa123"}, timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "access_token" in j and j["token_type"] == "bearer"
        assert j["user"]["role"] == "siswa"
        assert j["user"]["email"] == "siswa@smkbinaguna.sch.id"

    def test_login_guru_valid(self, http):
        r = http.post(f"{API}/auth/login", json={"email": "guru@smkbinaguna.sch.id", "password": "guru123"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "guru"

    def test_login_invalid_password(self, http):
        r = http.post(f"{API}/auth/login", json={"email": "siswa@smkbinaguna.sch.id", "password": "wrongpass"}, timeout=30)
        assert r.status_code == 401

    def test_login_unknown_email(self, http):
        r = http.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "anything"}, timeout=30)
        assert r.status_code == 401

    def test_me_requires_token(self, http):
        r = http.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_invalid_token(self, http):
        r = http.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.here"}, timeout=15)
        assert r.status_code == 401

    def test_me_valid(self, http, siswa_token):
        r = http.get(f"{API}/auth/me", headers=auth_headers(siswa_token), timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["role"] == "siswa"
        assert j["email"] == "siswa@smkbinaguna.sch.id"

    def test_register_new_siswa(self, http):
        email = f"test_siswa_{uuid.uuid4().hex[:8]}@example.com"
        payload = {"email": email, "password": "pass123", "name": "TEST Siswa", "role": "siswa", "kelas": "XI-RPL"}
        r = http.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "access_token" in j
        assert j["user"]["role"] == "siswa"
        assert j["user"]["kelas"] == "XI-RPL"

    def test_register_new_guru(self, http):
        email = f"test_guru_{uuid.uuid4().hex[:8]}@example.com"
        payload = {"email": email, "password": "pass123", "name": "TEST Guru", "role": "guru"}
        r = http.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["user"]["role"] == "guru"

    def test_register_duplicate_email(self, http):
        payload = {"email": "siswa@smkbinaguna.sch.id", "password": "siswa123", "name": "dup", "role": "siswa"}
        r = http.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r.status_code == 400

    def test_register_weak_password(self, http):
        email = f"weak_{uuid.uuid4().hex[:6]}@example.com"
        r = http.post(f"{API}/auth/register",
                      json={"email": email, "password": "123", "name": "x", "role": "siswa"},
                      timeout=30)
        assert r.status_code == 422


# ---------- analyses ----------
class TestAnalyses:
    analysis_id = None

    def test_guru_cannot_upload(self, http, guru_token, wav_path):
        with open(wav_path, "rb") as f:
            files = {"file": ("test.wav", f, "audio/wav")}
            r = http.post(f"{API}/analyses?title=Guru%20Try",
                          headers=auth_headers(guru_token), files=files, timeout=120)
        assert r.status_code == 403

    def test_upload_no_auth(self, http, wav_path):
        with open(wav_path, "rb") as f:
            r = http.post(f"{API}/analyses",
                          files={"file": ("test.wav", f, "audio/wav")}, timeout=60)
        assert r.status_code == 401

    def test_siswa_upload_analysis(self, http, siswa_token, wav_path):
        with open(wav_path, "rb") as f:
            files = {"file": ("test.wav", f, "audio/wav")}
            r = http.post(f"{API}/analyses?title=TEST%20Analysis",
                          headers=auth_headers(siswa_token), files=files, timeout=180)
        assert r.status_code == 200, r.text
        j = r.json()
        # required fields
        for k in ["id", "user_id", "user_name", "title", "intonation_score", "clarity_score",
                  "overall_score", "duration_seconds", "created_at", "transcript", "ai_feedback",
                  "mfcc_mean", "mfcc_std", "pitch_mean", "pitch_std"]:
            assert k in j, f"missing field {k}"
        assert isinstance(j["mfcc_mean"], list) and len(j["mfcc_mean"]) == 13
        assert isinstance(j["mfcc_std"], list) and len(j["mfcc_std"]) == 13
        assert 0.0 <= j["intonation_score"] <= 100.0
        assert 0.0 <= j["clarity_score"] <= 100.0
        assert 0.0 <= j["overall_score"] <= 100.0
        assert j["title"] == "TEST Analysis"
        assert isinstance(j["ai_feedback"], str) and len(j["ai_feedback"]) > 0
        assert j["duration_seconds"] > 2.5  # ~3s wav
        TestAnalyses.analysis_id = j["id"]

    def test_history_sorted_desc(self, http, siswa_token):
        r = http.get(f"{API}/analyses/history", headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1
        created = [x["created_at"] for x in rows]
        assert created == sorted(created, reverse=True)
        # ensure our created analysis is present
        if TestAnalyses.analysis_id:
            assert any(x["id"] == TestAnalyses.analysis_id for x in rows)

    def test_get_own_analysis_siswa(self, http, siswa_token):
        assert TestAnalyses.analysis_id
        r = http.get(f"{API}/analyses/{TestAnalyses.analysis_id}",
                     headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == TestAnalyses.analysis_id

    def test_guru_can_read_any_analysis(self, http, guru_token):
        assert TestAnalyses.analysis_id
        r = http.get(f"{API}/analyses/{TestAnalyses.analysis_id}",
                     headers=auth_headers(guru_token), timeout=30)
        assert r.status_code == 200

    def test_siswa_cannot_read_other_analysis(self, http, guru_token, siswa_token, wav_path):
        # register another siswa, upload an analysis, then verify the original siswa can't fetch it
        import uuid as _u
        email = f"other_siswa_{_u.uuid4().hex[:8]}@example.com"
        reg = http.post(f"{API}/auth/register",
                        json={"email": email, "password": "pass123", "name": "TEST Other Siswa",
                              "role": "siswa", "kelas": "XI-TKJ"}, timeout=30)
        assert reg.status_code == 200
        other_token = reg.json()["access_token"]

        with open(wav_path, "rb") as f:
            files = {"file": ("test.wav", f, "audio/wav")}
            up = http.post(f"{API}/analyses?title=Other",
                           headers=auth_headers(other_token), files=files, timeout=180)
        assert up.status_code == 200
        other_id = up.json()["id"]

        # original siswa should be forbidden
        r = http.get(f"{API}/analyses/{other_id}", headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 403

    def test_get_analysis_not_found(self, http, siswa_token):
        r = http.get(f"{API}/analyses/nonexistent-id-xyz",
                     headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 404


# ---------- materials ----------
class TestMaterials:
    def test_materials_requires_auth(self, http):
        r = http.get(f"{API}/materials", timeout=15)
        assert r.status_code == 401

    def test_materials_seeded(self, http, siswa_token):
        r = http.get(f"{API}/materials", headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        assert len(rows) == 6, f"expected 6 materials, got {len(rows)}"
        for m in rows:
            assert {"id", "title", "category", "content", "icon"} <= set(m.keys())


# ---------- teacher ----------
class TestTeacher:
    def test_students_requires_guru(self, http, siswa_token):
        r = http.get(f"{API}/teacher/students", headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 403

    def test_students_guru(self, http, guru_token):
        r = http.get(f"{API}/teacher/students", headers=auth_headers(guru_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1
        for s in rows:
            assert "id" in s and "recording_count" in s and "average_score" in s
            assert "latest" in s
            assert "password_hash" not in s

    def test_student_history_guru(self, http, guru_token):
        # find the seeded siswa id
        r = http.get(f"{API}/teacher/students", headers=auth_headers(guru_token), timeout=30)
        siswa = next((x for x in r.json() if x["email"] == "siswa@smkbinaguna.sch.id"), None)
        assert siswa is not None
        r2 = http.get(f"{API}/teacher/students/{siswa['id']}/analyses",
                      headers=auth_headers(guru_token), timeout=30)
        assert r2.status_code == 200
        assert isinstance(r2.json(), list)

    def test_student_history_forbidden_for_siswa(self, http, siswa_token, guru_token):
        r = http.get(f"{API}/teacher/students", headers=auth_headers(guru_token), timeout=30)
        siswa = next((x for x in r.json() if x["email"] == "siswa@smkbinaguna.sch.id"), None)
        assert siswa is not None
        r2 = http.get(f"{API}/teacher/students/{siswa['id']}/analyses",
                      headers=auth_headers(siswa_token), timeout=30)
        assert r2.status_code == 403

    def test_teacher_stats(self, http, guru_token):
        r = http.get(f"{API}/teacher/stats", headers=auth_headers(guru_token), timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert {"total_students", "total_analyses", "class_average"} <= set(j.keys())
        assert j["total_students"] >= 1
        assert j["total_analyses"] >= 1

    def test_teacher_stats_forbidden_for_siswa(self, http, siswa_token):
        r = http.get(f"{API}/teacher/stats", headers=auth_headers(siswa_token), timeout=30)
        assert r.status_code == 403
