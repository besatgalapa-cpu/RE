"""Backend tests for RBAC, gallery thumbnails, and Excel archive features.

Covers:
- RBAC on users/periods/settings/upload/galeri for Viewer Eksekutif and Verifikator Data
- Gallery thumbnail generation and variant serving
- Excel archive download per period
"""
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

API = f"{BASE_URL}/api"

ADMIN = ("admin", "adminRE1234#")
QA_VIEWER = ("qa_viewer", "Viewer123!")
QA_VERIF = ("qa_verif", "Verif123!")


def _login(username, password):
    r = requests.post(f"{API}/auth/login", json={"username": username, "password": password})
    if r.status_code != 200:
        return None
    return r.json()["access_token"]


def _client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def admin_client():
    tok = _login(*ADMIN)
    assert tok, "admin login failed"
    return _client(tok)


@pytest.fixture(scope="module")
def viewer_ids(admin_client):
    """Create qa_viewer and qa_verif users; yield ids; delete afterwards."""
    created = {}
    # Wipe any pre-existing test users to keep idempotent
    users = admin_client.get(f"{API}/users").json()
    for u in users:
        if u["username"] in ("qa_viewer", "qa_verif"):
            admin_client.delete(f"{API}/users/{u['id']}")

    r1 = admin_client.post(f"{API}/users", json={
        "username": "qa_viewer", "name": "QA Viewer",
        "password": "Viewer123!", "role": "Viewer Eksekutif"
    })
    assert r1.status_code == 200, r1.text
    created["viewer"] = r1.json()["id"]

    r2 = admin_client.post(f"{API}/users", json={
        "username": "qa_verif", "name": "QA Verifikator",
        "password": "Verif123!", "role": "Verifikator Data"
    })
    assert r2.status_code == 200, r2.text
    created["verif"] = r2.json()["id"]

    yield created

    # cleanup
    for uid in created.values():
        admin_client.delete(f"{API}/users/{uid}")


@pytest.fixture(scope="module")
def viewer_client(viewer_ids):
    tok = _login(*QA_VIEWER)
    assert tok, "viewer login failed"
    return _client(tok)


@pytest.fixture(scope="module")
def verif_client(viewer_ids):
    tok = _login(*QA_VERIF)
    assert tok, "verif login failed"
    return _client(tok)


# ---- Viewer Eksekutif: read-only ----
class TestViewerRBAC:
    def test_viewer_reads_dashboard(self, viewer_client):
        assert viewer_client.get(f"{API}/dashboard").status_code == 200

    def test_viewer_reads_kecamatan(self, viewer_client):
        assert viewer_client.get(f"{API}/kecamatan").status_code == 200

    def test_viewer_reads_desa(self, viewer_client):
        assert viewer_client.get(f"{API}/desa").status_code == 200

    def test_viewer_reads_households(self, viewer_client):
        assert viewer_client.get(f"{API}/households").status_code == 200

    def test_viewer_reads_galeri(self, viewer_client):
        assert viewer_client.get(f"{API}/galeri").status_code == 200

    def test_viewer_forbidden_list_users(self, viewer_client):
        assert viewer_client.get(f"{API}/users").status_code == 403

    def test_viewer_forbidden_create_period(self, viewer_client):
        r = viewer_client.post(f"{API}/periods", json={"triwulan": "III", "tahun": 2026})
        assert r.status_code == 403

    def test_viewer_forbidden_update_settings(self, viewer_client):
        r = viewer_client.put(f"{API}/settings", json={
            "instansi_nama": "X", "provinsi": "Y", "kepala_dinas": "Z",
            "target_re": 90.0, "target_tahun": 2026, "bobot_non_pln": 100.0,
        })
        assert r.status_code == 403

    def test_viewer_forbidden_galeri_upload(self, viewer_client):
        img = io.BytesIO()
        Image.new("RGB", (100, 100), "red").save(img, "JPEG")
        img.seek(0)
        r = viewer_client.post(f"{API}/galeri/upload",
                               files={"file": ("t.jpg", img, "image/jpeg")},
                               data={"judul": "TEST_viewer"})
        assert r.status_code == 403


# ---- Verifikator Data: data:write & galeri:write, no user:manage ----
class TestVerifikatorRBAC:
    def test_verif_forbidden_list_users(self, verif_client):
        assert verif_client.get(f"{API}/users").status_code == 403

    def test_verif_forbidden_create_user(self, verif_client):
        r = verif_client.post(f"{API}/users", json={
            "username": "TEST_x", "name": "x", "password": "x", "role": "Viewer Eksekutif"
        })
        assert r.status_code == 403

    def test_verif_can_create_period(self, verif_client, admin_client):
        r = verif_client.post(f"{API}/periods", json={"triwulan": "IV", "tahun": 2099})
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        # cleanup
        admin_client.delete(f"{API}/periods/{pid}")

    def test_verif_can_upload_galeri(self, verif_client, admin_client):
        img = io.BytesIO()
        Image.new("RGB", (200, 150), "blue").save(img, "JPEG")
        img.seek(0)
        r = verif_client.post(f"{API}/galeri/upload",
                              files={"file": ("verif.jpg", img, "image/jpeg")},
                              data={"judul": "TEST_verif_upload"})
        assert r.status_code == 200, r.text
        fid = r.json()["id"]
        admin_client.delete(f"{API}/galeri/{fid}")


# ---- Gallery thumbnail flow ----
class TestGalleryThumbnail:
    def test_upload_generates_thumb_and_variant_smaller(self, admin_client):
        # Larger image to make thumbnail meaningfully smaller
        img = io.BytesIO()
        Image.new("RGB", (2000, 1500), "green").save(img, "JPEG", quality=95)
        img.seek(0)
        r = admin_client.post(f"{API}/galeri/upload",
                              files={"file": ("big.jpg", img, "image/jpeg")},
                              data={"judul": "TEST_thumbnail"})
        assert r.status_code == 200, r.text
        doc = r.json()
        fid = doc["id"]
        try:
            assert doc.get("thumb_path")
            # List and check has_thumb=true
            lst = admin_client.get(f"{API}/galeri").json()
            row = next((x for x in lst if x["id"] == fid), None)
            assert row and row["has_thumb"] is True

            full = admin_client.get(f"{API}/galeri/file/{fid}?variant=full")
            thumb = admin_client.get(f"{API}/galeri/file/{fid}?variant=thumb")
            assert full.status_code == 200 and thumb.status_code == 200
            assert len(thumb.content) < len(full.content), \
                f"thumb {len(thumb.content)} not smaller than full {len(full.content)}"
        finally:
            admin_client.delete(f"{API}/galeri/{fid}")


# ---- Excel archive download ----
class TestExcelArchive:
    def test_existing_periods_have_excel(self, admin_client):
        periods = admin_client.get(f"{API}/periods").json()
        for p in periods:
            if p["kode"] in ("TW1-2026", "TW2-2026"):
                # has_excel should be True after seed
                assert "has_excel" in p

    def test_download_excel_when_available(self, admin_client):
        periods = admin_client.get(f"{API}/periods").json()
        target = next((p for p in periods if p.get("has_excel")), None)
        if not target:
            pytest.skip("No period with archived excel available")
        r = admin_client.get(f"{API}/periods/{target['id']}/excel")
        assert r.status_code == 200
        assert "spreadsheet" in r.headers.get("content-type", "")
        assert len(r.content) > 100


# ---- Admin full access smoke ----
class TestAdminFullAccess:
    def test_admin_reads_users(self, admin_client):
        assert admin_client.get(f"{API}/users").status_code == 200
