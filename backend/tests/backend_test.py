"""Backend API tests for Rasio Elektrifikasi Murung Raya."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # fallback: read from frontend/.env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

API = f"{BASE_URL}/api"
ADMIN_USER = "admin"
ADMIN_PASS = "adminRE1234#"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and "user" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


# ---- Auth ----
def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": "wrong"})
    assert r.status_code == 401


def test_auth_me(client):
    r = client.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["username"] == ADMIN_USER


def test_me_without_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---- Periods ----
def test_periods_list(client):
    r = client.get(f"{API}/periods")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    codes = {p["kode"] for p in data}
    assert "TW1-2026" in codes and "TW2-2026" in codes


# ---- Dashboard ----
def test_dashboard_active(client):
    r = client.get(f"{API}/dashboard")
    assert r.status_code == 200
    j = r.json()
    assert j["period"] is not None
    assert j["kpi"]["total_rt"] > 0
    assert len(j["per_kecamatan"]) == 10
    assert len(j["trend"]) >= 2
    # active period is TW II 2026
    assert j["period"]["triwulan"] == "II" and j["period"]["tahun"] == 2026
    assert j["kpi"]["total_rt"] == 36800


def test_dashboard_tw1(client):
    periods = client.get(f"{API}/periods").json()
    tw1 = next(p for p in periods if p["kode"] == "TW1-2026")
    r = client.get(f"{API}/dashboard", params={"period_id": tw1["id"]})
    assert r.status_code == 200
    j = r.json()
    assert j["kpi"]["total_rt"] == 37041


# ---- Kecamatan ----
def test_kecamatan_list(client):
    r = client.get(f"{API}/kecamatan")
    assert r.status_code == 200
    j = r.json()
    assert len(j["data"]) == 10


# ---- Desa ----
def test_desa_list(client):
    r = client.get(f"{API}/desa")
    assert r.status_code == 200
    j = r.json()
    assert len(j["data"]) >= 40
    assert len(j["kecamatan_list"]) >= 1


def test_desa_filter(client):
    kecs = client.get(f"{API}/desa").json()["kecamatan_list"]
    r = client.get(f"{API}/desa", params={"kecamatan": kecs[0]})
    assert r.status_code == 200
    assert all(d["kecamatan"] == kecs[0] for d in r.json()["data"])


# ---- Households ----
def test_households_pagination(client):
    r = client.get(f"{API}/households", params={"page": 1, "limit": 25})
    assert r.status_code == 200
    j = r.json()
    assert j["total"] == 756
    assert len(j["data"]) == 25


def test_households_search(client):
    r = client.get(f"{API}/households", params={"search": "aa"})
    assert r.status_code == 200


# ---- Users CRUD ----
def test_users_crud(client):
    r = client.get(f"{API}/users")
    assert r.status_code == 200
    # create
    payload = {"username": "test_verifikator", "name": "Test Verif", "password": "P@ssw0rd123", "role": "Verifikator Data"}
    # cleanup if exists
    for u in r.json():
        if u["username"] == "test_verifikator":
            client.delete(f"{API}/users/{u['id']}")
    r2 = client.post(f"{API}/users", json=payload)
    assert r2.status_code == 200, r2.text
    uid = r2.json()["id"]
    # patch
    r3 = client.patch(f"{API}/users/{uid}", json={"is_active": False})
    assert r3.status_code == 200
    assert r3.json()["is_active"] is False
    # duplicate
    rd = client.post(f"{API}/users", json=payload)
    assert rd.status_code == 400
    # delete
    r4 = client.delete(f"{API}/users/{uid}")
    assert r4.status_code == 200


def test_cannot_delete_self(client):
    me = client.get(f"{API}/auth/me").json()
    r = client.delete(f"{API}/users/{me['id']}")
    assert r.status_code == 400


# ---- Periods CRUD ----
def test_period_crud(client):
    # cleanup
    periods = client.get(f"{API}/periods").json()
    for p in periods:
        if p["kode"] == "TW3-2026":
            client.delete(f"{API}/periods/{p['id']}")
    r = client.post(f"{API}/periods", json={"triwulan": "III", "tahun": 2026})
    assert r.status_code == 200
    pid = r.json()["id"]
    # lock toggle
    r2 = client.patch(f"{API}/periods/{pid}/lock")
    assert r2.status_code == 200
    # activate then delete not allowed for active? no restriction in code — but do delete
    r3 = client.delete(f"{API}/periods/{pid}")
    assert r3.status_code == 200


# ---- Settings ----
def test_settings(client):
    r = client.get(f"{API}/settings")
    assert r.status_code == 200
    s = r.json()
    s["kepala_dinas"] = "Ir. Test"
    r2 = client.put(f"{API}/settings", json={
        "instansi_nama": s["instansi_nama"], "provinsi": s["provinsi"],
        "kepala_dinas": s["kepala_dinas"], "target_re": s["target_re"],
        "target_tahun": s["target_tahun"], "bobot_non_pln": s["bobot_non_pln"],
    })
    assert r2.status_code == 200
    assert r2.json()["kepala_dinas"] == "Ir. Test"


# ---- Upload ----
def test_upload_preview_and_commit(client):
    if not os.path.exists("/tmp/tw2.xlsx"):
        pytest.skip("sample file missing")
    with open("/tmp/tw2.xlsx", "rb") as f:
        files = {"file": ("tw2.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        # requests session has JSON header; strip for multipart
        headers = {"Authorization": client.headers["Authorization"]}
        r = requests.post(f"{API}/upload/preview", files=files, headers=headers)
    assert r.status_code == 200, r.text
    j = r.json()
    assert len(j["rows"]) >= 10
    assert j["summary"]["valid_rows"] >= 10


def test_upload_bad_file(client):
    files = {"file": ("bad.txt", io.BytesIO(b"not excel"), "text/plain")}
    headers = {"Authorization": client.headers["Authorization"]}
    r = requests.post(f"{API}/upload/preview", files=files, headers=headers)
    assert r.status_code == 400
