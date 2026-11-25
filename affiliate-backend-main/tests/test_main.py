import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.core.config import settings

# Setup isolated test database (SQLite in memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Reset the in-memory auth rate-limiter between tests. All TestClient calls share
    # one client IP, so without this the per-IP register/login limits accumulate
    # across tests and later tests get 429s.
    try:
        import app.main as _m
        _m._RL_BUCKETS.clear()
    except Exception:
        pass


@pytest.fixture(autouse=True)
def _no_network_email(monkeypatch):
    """Stop tests making real outbound email calls. Every send_* helper funnels
    through app.core.mail._send_email (MailerSend HTTP then SMTP fallback, each with
    a network timeout); reward/enrolment flows now succeed in tests and would try to
    send, hanging on those timeouts. Stub the single send point to a no-op."""
    import app.core.mail as _mail
    monkeypatch.setattr(_mail, "_send_email", lambda *a, **k: True)

def _registration_token(email, full_name):
    """Seed verified-email proof for tests unrelated to email delivery."""
    from datetime import datetime, timedelta
    from uuid import uuid4
    from app.models import OTPVerification
    token = str(uuid4())
    with TestingSessionLocal() as db:
        db.add(OTPVerification(email=email, full_name=full_name, otp_code="123456",
            purpose="registration", is_verified=True, verification_token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=10)))
        db.commit()
    return token


def _verified_register(payload):
    payload = dict(payload)
    payload["verification_token"] = _registration_token(payload["email"], payload["full_name"])
    return client.post("/auth/register", json=payload)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_register_and_login_flow():
    # 1. Register student (since database is empty, the first user becomes Admin)
    admin_payload = {
        "email": "admin@bheuni.ac.uk",
        "full_name": "Admin User",
        "password": "strongpassword123"
    }
    response = _verified_register(admin_payload)
    assert response.status_code == 201
    assert response.json()["email"] == "admin@bheuni.ac.uk"
    assert response.json()["role"] == "admin"
    
    # 2. Register normal student
    student_payload = {
        "email": "student@bheuni.ac.uk",
        "full_name": "Student User",
        "password": "studentpassword123"
    }
    response = _verified_register(student_payload)
    assert response.status_code == 201
    assert response.json()["role"] == "student"
    ref_code = response.json()["referral_code"]
    assert ref_code is not None

    # 3. Login as student
    login_payload = {
        "email": "student@bheuni.ac.uk",
        "password": "studentpassword123"
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Login as admin
    admin_login_payload = {
        "email": "admin@bheuni.ac.uk",
        "password": "strongpassword123"
    }
    admin_response = client.post("/auth/login", json=admin_login_payload)
    admin_token = admin_response.json()["access_token"]

    # 4. Check profile with auth headers
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "Student User"

    # 5. Check dashboard stats
    response = client.get("/ambassador/stats", headers=headers)
    assert response.status_code == 200
    assert float(response.json()["wallet_balance"]) == 0.00
    assert response.json()["tier"] == "standard"

    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 6. Submit a referral lead
    referral_payload = {
        "lead_name": "Prospective Lead",
        "lead_email": "lead@gmail.com",
        "lead_phone": "07123456789",
        "education_interest": "Computer Science BSc",
        "referrer_consent": True,
    }
    response = client.post("/ambassador/referrals", json=referral_payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["status"] == "submitted"
    referral_id = response.json()["id"]

    # 7. Validate referral lead (reward £5)
    response = client.put(f"/admin/referrals/{referral_id}/status", json={"status": "validated"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "validated"

    # Verify wallet has £5 (lead reward)
    response = client.get("/ambassador/stats", headers=headers)
    assert response.status_code == 200
    assert float(response.json()["wallet_balance"]) == 5.00

    # 8. Complete enrolment as International Student (reward £750)
    response = client.put(f"/admin/referrals/{referral_id}/status", json={"status": "enrolled_home"}, headers=admin_headers)
    assert response.status_code == 200

    # Enrolling no longer auto-credits the enrolment reward — it is approved in two
    # £250 installments by an admin (see test_enrolment_installments_flow). So after
    # enrolling the wallet holds only the £5 lead reward.
    response = client.get("/ambassador/stats", headers=headers)
    assert response.status_code == 200
    assert float(response.json()["wallet_balance"]) == 5.00


def test_dynamic_tier_parameter_change():
    # 1. Register Admin
    admin_payload = {
        "email": "admin2@bheuni.ac.uk",
        "full_name": "Admin User 2",
        "password": "strongpassword123"
    }
    response = _verified_register(admin_payload)
    assert response.status_code == 201
    
    # 2. Register normal student
    student_payload = {
        "email": "student2@bheuni.ac.uk",
        "full_name": "Student User 2",
        "password": "studentpassword123"
    }
    response = _verified_register(student_payload)
    assert response.status_code == 201

    # Login admin & student
    admin_token = client.post("/auth/login", json={"email": "admin2@bheuni.ac.uk", "password": "strongpassword123"}).json()["access_token"]
    student_token = client.post("/auth/login", json={"email": "student2@bheuni.ac.uk", "password": "studentpassword123"}).json()["access_token"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Submit a referral lead & validate it (validated lead count = 1)
    referral_payload = {
        "lead_name": "Prospective Lead 2",
        "lead_email": "lead2@gmail.com",
        "lead_phone": "07123456789",
        "education_interest": "Computer Science BSc",
        "referrer_consent": True,
    }
    resp_ref = client.post("/ambassador/referrals", json=referral_payload, headers=student_headers)
    ref_id = resp_ref.json()["id"]
    client.put(f"/admin/referrals/{ref_id}/status", json={"status": "validated"}, headers=admin_headers)

    # 4. Verify student is Standard tier (since Bronze threshold is default 10 leads)
    stats_resp = client.get("/ambassador/stats", headers=student_headers)
    assert stats_resp.json()["tier"] == "standard"
    assert float(stats_resp.json()["wallet_balance"]) == 5.00  # Lead validation reward is £5

    # 5. Fetch current tier configs
    configs_resp = client.get("/admin/tier-configs", headers=admin_headers)
    assert configs_resp.status_code == 200
    configs = configs_resp.json()
    # Find Bronze config
    bronze_cfg = next(c for c in configs if c["tier"] == "bronze")
    assert bronze_cfg["leads_required"] == 10
    assert float(bronze_cfg["bonus_amount"]) == 25.00

    # 6. Admin updates Bronze threshold from 10 to 1 lead
    update_payload = {
        "leads_required": 1,
        "bonus_amount": 25.00
    }
    update_resp = client.put("/admin/tier-configs/bronze", json=update_payload, headers=admin_headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["leads_required"] == 1

    # 7. Student tier should be automatically recalculated to Bronze, awarding the £25 bonus!
    stats_resp = client.get("/ambassador/stats", headers=student_headers)
    assert stats_resp.json()["tier"] == "bronze"
    # Balance should be £5 (validated lead) + £25 (Bronze bonus) = £30
    assert float(stats_resp.json()["wallet_balance"]) == 30.00
    assert float(stats_resp.json()["total_earned"]) == 30.00

def test_compliance_clawback_and_cleanup():
    # 1. Register admin and student
    admin_payload = {
        "email": "admin_comp@bheuni.ac.uk",
        "full_name": "Admin Compliance",
        "password": "strongpassword123"
    }
    _verified_register(admin_payload)
    
    student_payload = {
        "email": "student_comp@bheuni.ac.uk",
        "full_name": "Student Compliance",
        "password": "studentpassword123"
    }
    _verified_register(student_payload)

    admin_token = client.post("/auth/login", json={"email": "admin_comp@bheuni.ac.uk", "password": "strongpassword123"}).json()["access_token"]
    student_token = client.post("/auth/login", json={"email": "student_comp@bheuni.ac.uk", "password": "studentpassword123"}).json()["access_token"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 2. Submit referral lead
    referral_payload = {
        "lead_name": "Clawback Lead",
        "lead_email": "clawback@gmail.com",
        "lead_phone": "07123456789",
        "education_interest": "Business Management BA",
        "referrer_consent": True,
    }
    resp = client.post("/ambassador/referrals", json=referral_payload, headers=student_headers)
    ref_id = resp.json()["id"]

    # 3. Set to enrolled_home — credits ONLY the £5 lead reward now (the enrolment
    # reward is no longer auto-credited; it is paid in two £250 installments).
    client.put(f"/admin/referrals/{ref_id}/status", json={"status": "enrolled_home"}, headers=admin_headers)
    stats_resp = client.get("/ambassador/stats", headers=student_headers)
    assert float(stats_resp.json()["wallet_balance"]) == 5.00

    # 4. Approve BOTH enrolment installments (£250 each) → £5 + £500 = £505
    r1 = client.post(f"/admin/referrals/{ref_id}/pay-enrolment-installment/1", headers=admin_headers)
    assert r1.status_code == 200
    r2 = client.post(f"/admin/referrals/{ref_id}/pay-enrolment-installment/2", headers=admin_headers)
    assert r2.status_code == 200
    stats_resp = client.get("/ambassador/stats", headers=student_headers)
    assert float(stats_resp.json()["wallet_balance"]) == 505.00

    # 5. Apply clawback (within 14 days) — reverses the paid enrolment installments
    clawback_resp = client.post(f"/admin/referrals/{ref_id}/clawback", headers=admin_headers)
    assert clawback_resp.status_code == 200

    # 6. Verify wallet balance debited back to £5 (lead reward remains)
    stats_resp = client.get("/ambassador/stats", headers=student_headers)
    assert float(stats_resp.json()["wallet_balance"]) == 5.00
    assert float(stats_resp.json()["total_earned"]) == 5.00

    # 7. Test cleanup logic by backdating a referral
    from datetime import datetime, timedelta
    from app.models import Referral
    
    db = next(override_get_db())
    # Submit another referral
    ref_payload_2 = {
        "lead_name": "Expired Lead",
        "lead_email": "expired@gmail.com",
        "lead_phone": "07123456789",
        "education_interest": "Business Management BA",
        "referrer_consent": True,
    }
    resp_2 = client.post("/ambassador/referrals", json=ref_payload_2, headers=student_headers)
    ref_id_2 = resp_2.json()["id"]

    # Backdate it by 8 days so it expires under the 7 days rule
    db_ref = db.query(Referral).filter(Referral.id == ref_id_2).first()
    db_ref.created_at = datetime.utcnow() - timedelta(days=8)
    db.commit()

    # Call cleanup endpoint
    cleanup_resp = client.post("/admin/leads/cleanup", headers=admin_headers)
    assert cleanup_resp.status_code == 200
    assert cleanup_resp.json()["expired_submitted"] == 1

    # Verify referral status is now rejected
    ref_check = client.get("/ambassador/referrals", headers=student_headers).json()
    ref_status = next(r for r in ref_check if r["id"] == ref_id_2)["status"]
    assert ref_status == "rejected"


def test_google_login_flow(monkeypatch):
    # Register first user (admin) so the Google user will be a student
    _verified_register({
        "email": "system_admin@bheuni.ac.uk",
        "full_name": "System Admin",
        "password": "strongpassword123"
    })

    # The insecure mock-token bypass was removed for security (real tokens are always
    # verified), so mock Google's verifier itself. google_login imports id_token from
    # google.oauth2, so patch that module's function.
    from google.oauth2 import id_token as _idtok
    monkeypatch.setattr(_idtok, "verify_oauth2_token", lambda *a, **k: {
        "email": "google-user@example.com", "name": "Google User Name",
    })

    # 1. Google sign-in/up (new user)
    google_payload = {"credential": "any-token-now-verified-by-the-mock"}
    response = client.post("/auth/google", json=google_payload)
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token is not None

    # 2. Verify /auth/me info
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "google-user@example.com"
    assert response.json()["full_name"] == "Google User Name"
    assert response.json()["role"] == "student"

    # 3. Google sign-in again (existing user)
    response2 = client.post("/auth/google", json=google_payload)
    assert response2.status_code == 200
    token2 = response2.json()["access_token"]
    assert token2 is not None


def test_enrolment_installments_flow():
    """The £500 enrolment reward pays as two admin-approved £250 installments."""
    _register("admin_inst@bheuni.ac.uk", "Admin Inst")
    admin = _hdr(_login("admin_inst@bheuni.ac.uk"))
    stud = _hdr(_register_simple("stud_inst@bheuni.ac.uk"))

    ref = client.post("/ambassador/referrals", json={
        "lead_name": "Inst Lead", "lead_email": "inst@e.com",
        "lead_phone": "07000000002", "referrer_consent": True,
    }, headers=stud).json()
    ref_id = ref["id"]
    client.put(f"/admin/referrals/{ref_id}/status", json={"status": "enrolled_home"}, headers=admin)

    # Enrolling credits ONLY the £5 lead reward (enrolment reward is not auto-paid).
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 5.00

    # Installment 2 cannot be approved before installment 1.
    assert client.post(f"/admin/referrals/{ref_id}/pay-enrolment-installment/2", headers=admin).status_code == 400

    # KPI: one enrolment awaiting, £500 outstanding.
    stats = client.get("/admin/stats", headers=admin).json()
    assert stats["pending_enrolment_rewards_count"] == 1
    assert float(stats["pending_enrolment_rewards_amount"]) == 500.00

    # Approve installment 1 → +£250, not yet fully paid.
    r1 = client.post(f"/admin/referrals/{ref_id}/pay-enrolment-installment/1", headers=admin)
    assert r1.status_code == 200
    assert r1.json()["enrolment_installment_1_paid"] is True
    assert r1.json()["enrolment_reward_paid"] is False
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 255.00

    # Installment 1 cannot be paid twice.
    assert client.post(f"/admin/referrals/{ref_id}/pay-enrolment-installment/1", headers=admin).status_code == 400

    # KPI now shows £250 outstanding.
    assert float(client.get("/admin/stats", headers=admin).json()["pending_enrolment_rewards_amount"]) == 250.00

    # Approve installment 2 → +£250, fully paid (£5 + £500 = £505).
    r2 = client.post(f"/admin/referrals/{ref_id}/pay-enrolment-installment/2", headers=admin)
    assert r2.status_code == 200
    assert r2.json()["enrolment_reward_paid"] is True
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 505.00

    # KPI drops off once fully settled.
    stats = client.get("/admin/stats", headers=admin).json()
    assert stats["pending_enrolment_rewards_count"] == 0
    assert float(stats["pending_enrolment_rewards_amount"]) == 0.00

    # Ambassador dashboard payload exposes the per-installment state + enrolment date.
    row = next(r for r in client.get("/ambassador/referrals", headers=stud).json() if r["id"] == ref_id)
    assert row["enrolment_installment_1_paid"] is True
    assert row["enrolment_installment_2_paid"] is True
    assert row["enrolled_at"] is not None


def test_otp_registration_flow():
    # Register first user (admin) so that the subsequent registrants will be standard students
    _verified_register({
        "email": "system_admin_otp@bheuni.ac.uk",
        "full_name": "System Admin OTP",
        "password": "strongpassword123"
    })

    email = "ambassador_otp@bheuni.ac.uk"
    full_name = "Ambassador OTP User"

    # 1. Initiate registration
    response = client.post("/auth/register/initiate", json={
        "email": email,
        "full_name": full_name
    })
    assert response.status_code == 200

    # 2. Query DB to get the generated OTP code
    db = next(override_get_db())
    from app.models import OTPVerification
    otp_entry = db.query(OTPVerification).filter(OTPVerification.email == email).first()
    assert otp_entry is not None
    otp_code = otp_entry.otp_code

    # 3. Verify OTP
    response = client.post("/auth/register/verify", json={
        "email": email,
        "otp": otp_code
    })
    assert response.status_code == 200
    verification_token = response.json()["verification_token"]
    assert verification_token is not None

    # 4. Complete registration (Set Password)
    response = client.post("/auth/register/complete", json={
        "email": email,
        "verification_token": verification_token,
        "password": "securepassword123"
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token is not None

    # 5. Check user details
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == email
    assert response.json()["full_name"] == full_name
    assert response.json()["role"] == "student"




def test_crm_lead_event_receiver_and_manual_reward():
    """CRM emits a qualified lead → recorded as pending (no auto-credit) → admin
    manually approves payment → ambassador wallet credited. Covers auth, idempotency
    and double-pay guard. See docs/integration/crm-affiliate-contract.md."""
    # First user = admin, second = ambassador
    _verified_register({
        "email": "admin_crm@bheuni.ac.uk", "full_name": "CRM Admin", "password": "strongpassword123"})
    amb = _verified_register({
        "email": "amb_crm@bheuni.ac.uk", "full_name": "Alex Morgan", "password": "studentpassword123"})
    ref_code = amb.json()["referral_code"]

    admin_token = client.post("/auth/login", json={
        "email": "admin_crm@bheuni.ac.uk", "password": "strongpassword123"}).json()["access_token"]
    amb_token = client.post("/auth/login", json={
        "email": "amb_crm@bheuni.ac.uk", "password": "studentpassword123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    amb_headers = {"Authorization": f"Bearer {amb_token}"}

    # Configure the shared service key for the receiver.
    settings.CRM_SERVICE_KEY = "test-crm-key"
    good_key = {"X-CRM-Service-Key": "test-crm-key"}

    event = {
        "event": "lead_qualified",
        "external_lead_id": "crm-lead-0001",
        "referral_code": ref_code,
        "lead_email": "friend@example.com",
        "lead_name": "Jane Friend",
        "source": "crm",
    }

    # Missing/bad key → 401
    assert client.post("/integrations/crm/lead-event", json=event).status_code == 401
    assert client.post("/integrations/crm/lead-event", json=event,
                       headers={"X-CRM-Service-Key": "wrong"}).status_code == 401

    # Valid event → recorded, pending approval, NOT credited
    resp = client.post("/integrations/crm/lead-event", json=event, headers=good_key)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["outcome"] == "pending_approval"
    referral_id = body["referral_id"]
    assert referral_id
    # Wallet still zero — no auto-credit
    assert float(client.get("/ambassador/stats", headers=amb_headers).json()["wallet_balance"]) == 0.00

    # Idempotent: same external_lead_id again → duplicate_ignored, no new referral
    dup = client.post("/integrations/crm/lead-event", json=event, headers=good_key)
    assert dup.json()["outcome"] == "duplicate_ignored"

    # Unknown referral code + referrer details → ambassador auto-created, pending
    created = client.post("/integrations/crm/lead-event", json={
        **event, "external_lead_id": "crm-lead-0002", "referral_code": "BHE-NEW777",
        "referrer_name": "New Ambassador", "referrer_email": "newamb@example.com"}, headers=good_key)
    assert created.json()["outcome"] == "pending_approval"
    assert created.json()["ambassador_id"]
    assert created.json()["referral_id"]

    # Admin manually approves the reward → ambassador credited £10
    pay = client.post(f"/admin/referrals/{referral_id}/pay-lead-reward", headers=admin_headers)
    assert pay.status_code == 200, pay.text
    assert pay.json()["lead_reward_paid"] is True
    assert float(client.get("/ambassador/stats", headers=amb_headers).json()["wallet_balance"]) == 10.00

    # Double-pay guard → 400
    assert client.post(f"/admin/referrals/{referral_id}/pay-lead-reward", headers=admin_headers).status_code == 400


def test_crm_lead_submitted_then_qualified_promotion():
    """A lead captured via the shared link (lead_submitted) records with NO reward,
    then a later lead_qualified on the same CRM lead promotes it to actionable."""
    _verified_register({
        "email": "admin_flow@bheuni.ac.uk", "full_name": "Flow Admin", "password": "strongpassword123"})
    admin_token = client.post("/auth/login", json={
        "email": "admin_flow@bheuni.ac.uk", "password": "strongpassword123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    settings.CRM_SERVICE_KEY = "test-crm-key"
    good_key = {"X-CRM-Service-Key": "test-crm-key"}

    base = {
        "external_lead_id": "crm-flow-001",
        "referral_code": "BHE-FLOW1",
        "lead_email": "newfriend@example.com",
        "lead_name": "New Friend",
        "referrer_name": "Md Mahbubur",
        "referrer_email": "referrer_flow@example.com",
        "source": "crm",
    }

    # 1. Lead submitted via shared link → recorded, ambassador auto-created, no reward
    sub = client.post("/integrations/crm/lead-event", json={**base, "event": "lead_submitted"}, headers=good_key)
    assert sub.status_code == 200, sub.text
    assert sub.json()["outcome"] == "recorded"
    referral_id = sub.json()["referral_id"]
    amb_id = sub.json()["ambassador_id"]
    assert referral_id and amb_id

    # Not actionable yet (status submitted) — the admin can't pay a raw lead
    assert client.post(f"/admin/referrals/{referral_id}/pay-lead-reward", headers=admin_headers).status_code == 400

    # 2. Same lead later qualified → promoted to validated (actionable)
    qual = client.post("/integrations/crm/lead-event", json={**base, "event": "lead_qualified"}, headers=good_key)
    assert qual.json()["outcome"] == "updated"

    # 3. Now approvable → ambassador credited £10
    pay = client.post(f"/admin/referrals/{referral_id}/pay-lead-reward", headers=admin_headers)
    assert pay.status_code == 200, pay.text
    assert pay.json()["lead_reward_paid"] is True
    assert pay.json()["status"] == "validated"


def test_crm_lead_status_changed_mirrors_status_without_touching_reward():
    """A `lead_status_changed` event mirrors the EXACT CRM status + reason onto the
    referral for display, and must NOT change the reward `status` enum."""
    _verified_register({
        "email": "admin_sm@bheuni.ac.uk", "full_name": "SM Admin", "password": "strongpassword123"})
    admin_token = client.post("/auth/login", json={
        "email": "admin_sm@bheuni.ac.uk", "password": "strongpassword123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    settings.CRM_SERVICE_KEY = "test-crm-key"
    good_key = {"X-CRM-Service-Key": "test-crm-key"}
    base = {
        "external_lead_id": "crm-sm-001", "referral_code": "BHE-SM1",
        "lead_email": "sm_lead@example.com", "lead_name": "SM Lead",
        "referrer_name": "SM Referrer", "referrer_email": "sm_ref@example.com", "source": "crm",
    }

    # Seed the referral (reward status = submitted).
    sub = client.post("/integrations/crm/lead-event", json={**base, "event": "lead_submitted"}, headers=good_key)
    assert sub.status_code == 200, sub.text
    referral_id = sub.json()["referral_id"]

    # Counsellor sets an interim status with a reason.
    ev = client.post("/integrations/crm/lead-event", json={
        **base, "event": "lead_status_changed",
        "status": "In Progress", "reason": "Spoke to student, will call back",
    }, headers=good_key)
    assert ev.status_code == 200, ev.text

    # Exact status + reason mirrored; reward enum untouched.
    lead = next(l for l in client.get("/admin/leads", headers=admin_headers).json() if l["id"] == referral_id)
    assert lead["crm_lead_status"] == "In Progress"
    assert lead["status_reason"] == "Spoke to student, will call back"
    assert lead["status"] == "submitted"  # reward pipeline untouched


# =========================================================================
# FULL INTEGRATION SUITE — new work + failure paths (payouts, admin views,
# authorization, CRM rejection/enrolment sync, counsellor routing).
# All tests reuse the module's fresh-DB `clean_db` fixture and TestClient.
# =========================================================================

def _register(email, name="User Name", pw="strongpassword123"):
    return _verified_register({"email": email, "full_name": name, "password": pw})

def _login(email, pw="strongpassword123"):
    return client.post("/auth/login", json={"email": email, "password": pw}).json()["access_token"]

def _hdr(token):
    return {"Authorization": f"Bearer {token}"}

def _register_simple(email, first="Amb", last="Assador", phone="07123456789",
                     pw="strongpassword123", counsellor_id=None, counsellor_name=None):
    """Second+ registrant → student. Returns the access token."""
    return client.post("/auth/register/simple", json={
        "first_name": first, "last_name": last, "email": email, "phone": phone,
        "verification_token": _registration_token(email, f"{first} {last}"),
        "password": pw, "counsellor_id": counsellor_id, "counsellor_name": counsellor_name,
        # GDPR: signup now requires accepting the Ambassador & Privacy policies.
        "policy_accepted": True,
    }).json()["access_token"]

def _credit_wallet(email, amount):
    """Directly top up a wallet to isolate payout tests from the reward flow."""
    from app.models import User
    from decimal import Decimal
    db = next(override_get_db())
    u = db.query(User).filter(User.email == email).first()
    u.wallet_balance = Decimal(str(amount))
    db.add(u); db.commit()


def _set_billing_address(email):
    """Give a user a saved billing address so bank-transfer payouts are allowed
    (bank transfers require a billing address on the ambassador's profile)."""
    from app.models import User
    db = next(override_get_db())
    u = db.query(User).filter(User.email == email).first()
    bd = dict(u.bank_details or {})
    bd["address"] = {"line1": "1 Test Street", "city": "London", "postcode": "E1 6AN", "country": "United Kingdom"}
    u.bank_details = bd
    db.add(u); db.commit()


# ---- Authorization / auth ------------------------------------------------

def test_authorization_admin_guard():
    _register("admin_g@bheuni.ac.uk", "Admin G")
    _register("stud_g@bheuni.ac.uk", "Student G", "studentpassword123")
    stud = _hdr(_login("stud_g@bheuni.ac.uk", "studentpassword123"))

    # A student must be forbidden from every admin surface.
    for path in ["/admin/stats", "/admin/leads", "/admin/ambassadors",
                 "/admin/counsellors-breakdown", "/admin/payouts", "/admin/users",
                 "/admin/referrals", "/admin/tier-configs"]:
        assert client.get(path, headers=stud).status_code == 403, path

def test_auth_missing_and_invalid_token():
    # No token → 401; garbage token → 401.
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers=_hdr("not-a-real-token")).status_code == 401
    assert client.get("/admin/stats", headers=_hdr("not-a-real-token")).status_code == 401


# ---- Payout policy + validation failures ---------------------------------

def test_payout_policy_endpoint():
    r = client.get("/public/payout-policy")
    assert r.status_code == 200
    assert r.json()["min_withdrawal"] == 50.0
    assert r.json()["max_withdrawal"] == 5000.0

def test_payout_validation_failures():
    _register("admin_pv@bheuni.ac.uk", "Admin PV")
    stud = _hdr(_register_simple("stud_pv@bheuni.ac.uk"))

    # Below the £50 bank-transfer minimum → 400 (min/max is checked first, before
    # method details, address and balance).
    r = client.post("/ambassador/payouts", json={"amount": 30, "payment_method": "bank_transfer",
                    "bank_details": {"holder_name": "A", "sort_code": "20-00-00", "account_number": "12345678"}},
                    headers=stud)
    assert r.status_code == 400 and "between" in r.json()["detail"].lower()

    # Gift card with no delivery email → 400
    r = client.post("/ambassador/payouts", json={"amount": 50, "payment_method": "gift_card"}, headers=stud)
    assert r.status_code == 400 and "email" in r.json()["detail"].lower()

    # Bank transfer missing account details → 400
    r = client.post("/ambassador/payouts", json={"amount": 50, "payment_method": "bank_transfer",
                    "bank_details": {"holder_name": "A"}}, headers=stud)
    assert r.status_code == 400 and "account" in r.json()["detail"].lower()

    # Valid amount/method but zero balance → 400 insufficient. Use a gift card so we
    # reach the balance check (bank transfers would fail earlier on the missing
    # billing address).
    r = client.post("/ambassador/payouts", json={"amount": 50, "payment_method": "gift_card",
                    "gift_card_email": "x@y.com"}, headers=stud)
    assert r.status_code == 400 and "insufficient" in r.json()["detail"].lower()


# ---- Payout happy path: pending → mark paid (manual provider) -------------

def test_payout_pending_then_mark_paid():
    _register("admin_pp@bheuni.ac.uk", "Admin PP")
    admin = _hdr(_login("admin_pp@bheuni.ac.uk"))
    tok = _register_simple("stud_pp@bheuni.ac.uk")
    stud = _hdr(tok)
    _credit_wallet("stud_pp@bheuni.ac.uk", 100)
    _set_billing_address("stud_pp@bheuni.ac.uk")  # bank transfers require a saved address

    # Request £50 bank → created PENDING (no silent auto-pay), wallet held to £50
    r = client.post("/ambassador/payouts", json={"amount": 50, "payment_method": "bank_transfer",
                    "bank_details": {"holder_name": "A", "sort_code": "20-00-00", "account_number": "12345678"}},
                    headers=stud)
    assert r.status_code == 201, r.text
    assert r.json()["status"] == "pending"
    payout_id = r.json()["id"]
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 50.00

    # Admin sees it pending
    payouts = client.get("/admin/payouts", headers=admin).json()
    assert any(p["id"] == payout_id and p["status"] == "pending" for p in payouts)

    # Mark paid → paid, manual provider leaves provider_ref null, wallet unchanged
    paid = client.put(f"/admin/payouts/{payout_id}/status", json={"status": "paid"}, headers=admin)
    assert paid.status_code == 200, paid.text
    assert paid.json()["status"] == "paid"
    assert paid.json()["provider_ref"] is None
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 50.00

    # Re-processing a settled payout → 400
    again = client.put(f"/admin/payouts/{payout_id}/status", json={"status": "paid"}, headers=admin)
    assert again.status_code == 400

def test_payout_cancel_refunds():
    _register("admin_pc@bheuni.ac.uk", "Admin PC")
    admin = _hdr(_login("admin_pc@bheuni.ac.uk"))
    stud = _hdr(_register_simple("stud_pc@bheuni.ac.uk"))
    _credit_wallet("stud_pc@bheuni.ac.uk", 100)
    _set_billing_address("stud_pc@bheuni.ac.uk")  # bank transfers require a saved address

    r = client.post("/ambassador/payouts", json={"amount": 50, "payment_method": "bank_transfer",
                    "bank_details": {"holder_name": "A", "sort_code": "20-00-00", "account_number": "12345678"}},
                    headers=stud)
    payout_id = r.json()["id"]
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 50.00

    # Cancel → amount refunded to wallet
    cancel = client.put(f"/admin/payouts/{payout_id}/status", json={"status": "cancelled"}, headers=admin)
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 100.00


# ---- Reward denial + CRM rejection/enrolment sync ------------------------

def test_deny_lead_reward_flow():
    _register("admin_dn@bheuni.ac.uk", "Admin DN")
    admin = _hdr(_login("admin_dn@bheuni.ac.uk"))
    stud_tok = _register_simple("stud_dn@bheuni.ac.uk")
    stud = _hdr(stud_tok)
    ref_code = client.get("/auth/me", headers=stud).json()["referral_code"]

    settings.CRM_SERVICE_KEY = "test-crm-key"
    good = {"X-CRM-Service-Key": "test-crm-key"}
    ev = {"event": "lead_qualified", "external_lead_id": "dn-1", "referral_code": ref_code,
          "lead_email": "f@e.com", "lead_name": "Friend", "source": "crm"}
    referral_id = client.post("/integrations/crm/lead-event", json=ev, headers=good).json()["referral_id"]

    # Deny → rejected, not paid
    deny = client.post(f"/admin/referrals/{referral_id}/deny-lead-reward", headers=admin)
    assert deny.status_code == 200, deny.text
    assert deny.json()["status"] == "rejected"
    assert deny.json()["lead_reward_paid"] is False
    # Paying a rejected lead is not allowed
    assert client.post(f"/admin/referrals/{referral_id}/pay-lead-reward", headers=admin).status_code == 400

def test_crm_rejection_and_toggle():
    _register("admin_rj@bheuni.ac.uk", "Admin RJ")
    stud = _hdr(_register_simple("stud_rj@bheuni.ac.uk"))
    ref_code = client.get("/auth/me", headers=stud).json()["referral_code"]
    settings.CRM_SERVICE_KEY = "test-crm-key"
    good = {"X-CRM-Service-Key": "test-crm-key"}
    base = {"external_lead_id": "rj-1", "referral_code": ref_code,
            "lead_email": "f@e.com", "lead_name": "Friend", "source": "crm"}

    # qualified → validated
    q = client.post("/integrations/crm/lead-event", json={**base, "event": "lead_qualified"}, headers=good)
    assert q.json()["outcome"] == "pending_approval"

    # rejected with reason → status rejected, reason stored, visible to ambassador
    rej = client.post("/integrations/crm/lead-event",
                      json={**base, "event": "lead_rejected", "reason": "Not a genuine applicant"}, headers=good)
    assert rej.json()["outcome"] == "updated"
    refs = client.get("/ambassador/referrals", headers=stud).json()
    row = next(r for r in refs if r["status"] == "rejected")
    assert row["rejection_reason"] == "Not a genuine applicant"

    # toggle back: qualified again → validated (last decision wins)
    q2 = client.post("/integrations/crm/lead-event", json={**base, "event": "lead_qualified"}, headers=good)
    assert q2.json()["outcome"] == "updated"
    refs2 = client.get("/ambassador/referrals", headers=stud).json()
    assert refs2[0]["status"] == "validated"
    assert refs2[0]["rejection_reason"] in (None, "")

def test_crm_enrolled_event_does_not_autocredit():
    _register("admin_en@bheuni.ac.uk", "Admin EN")
    stud = _hdr(_register_simple("stud_en@bheuni.ac.uk"))
    ref_code = client.get("/auth/me", headers=stud).json()["referral_code"]
    settings.CRM_SERVICE_KEY = "test-crm-key"
    good = {"X-CRM-Service-Key": "test-crm-key"}

    ev = {"event": "lead_enrolled", "external_lead_id": "en-1", "referral_code": ref_code,
          "lead_email": "f@e.com", "lead_name": "Friend", "enrolment_type": "international", "source": "crm"}
    r = client.post("/integrations/crm/lead-event", json=ev, headers=good)
    assert r.json()["outcome"] == "pending_approval"
    # CRM events NEVER auto-credit — wallet stays zero until an admin approves.
    assert float(client.get("/ambassador/stats", headers=stud).json()["wallet_balance"]) == 0.00


# ---- Admin aggregation views --------------------------------------------

def _seed_admin_with_data():
    _register("admin_agg@bheuni.ac.uk", "Agg Admin")
    admin = _hdr(_login("admin_agg@bheuni.ac.uk"))
    # Ambassador WITH a counsellor + a lead
    a_tok = _register_simple("amb_c@bheuni.ac.uk", first="Cara", last="Counsel",
                             counsellor_id="40", counsellor_name="Alif Tasnim")
    a = _hdr(a_tok)
    client.post("/ambassador/referrals", json={"lead_name": "Lead One", "lead_email": "l1@e.com",
                "lead_phone": "07000000000", "education_interest": "MSc Data", "referrer_consent": True}, headers=a)
    # Ambassador WITHOUT a counsellor + a lead
    b_tok = _register_simple("amb_u@bheuni.ac.uk", first="Uma", last="Unassigned")
    b = _hdr(b_tok)
    client.post("/ambassador/referrals", json={"lead_name": "Lead Two", "lead_email": "l2@e.com",
                "lead_phone": "07000000001", "referrer_consent": True}, headers=b)
    return admin

def test_admin_leads_enrichment():
    admin = _seed_admin_with_data()
    leads = client.get("/admin/leads", headers=admin).json()
    assert len(leads) == 2
    one = next(l for l in leads if l["lead_name"] == "Lead One")
    assert one["referrer_name"] == "Cara Counsel"
    assert one["counsellor_name"] == "Alif Tasnim"
    assert "awaiting_reward" in one and "reward_amount" in one

def test_admin_ambassadors_counts():
    admin = _seed_admin_with_data()
    ambs = client.get("/admin/ambassadors", headers=admin).json()
    cara = next(a for a in ambs if a["email"] == "amb_c@bheuni.ac.uk")
    assert cara["total_leads"] == 1
    assert cara["counsellor_name"] == "Alif Tasnim"
    assert cara["has_bank_details"] is False

def test_admin_counsellor_breakdown():
    admin = _seed_admin_with_data()
    rows = client.get("/admin/counsellors-breakdown", headers=admin).json()
    named = {r["counsellor_name"]: r for r in rows}
    assert "Alif Tasnim" in named and named["Alif Tasnim"]["total_leads"] == 1
    assert "Unassigned" in named and named["Unassigned"]["total_leads"] == 1

def test_admin_stats_kpis():
    admin = _seed_admin_with_data()
    s = client.get("/admin/stats", headers=admin).json()
    for key in ["total_ambassadors", "total_qualified", "total_enrolled",
                "pending_rewards_count", "pending_rewards_amount",
                "pending_payouts_count", "pending_payouts_amount", "wallet_liability"]:
        assert key in s, key
    assert s["total_ambassadors"] == 2
    assert s["total_referrals"] == 2


# ---- Counsellor routing storage -----------------------------------------

def test_counsellor_routing_storage():
    _register("admin_cr@bheuni.ac.uk", "Admin CR")
    tok = _register_simple("amb_cr@bheuni.ac.uk", counsellor_id="40", counsellor_name="Alif Tasnim")
    h = _hdr(tok)
    me = client.get("/auth/me", headers=h).json()
    assert me["counsellor_id"] == "40"
    assert me["counsellor_name"] == "Alif Tasnim"

    # Reassign counsellor via settings
    client.put("/auth/settings", json={"counsellor_id": "99", "counsellor_name": "New Counsellor"}, headers=h)
    assert client.get("/auth/me", headers=h).json()["counsellor_id"] == "99"

    # Clear counsellor ("None of the above")
    client.put("/auth/settings", json={"counsellor_id": None, "counsellor_name": None}, headers=h)
    assert client.get("/auth/me", headers=h).json()["counsellor_id"] is None


# ── CRM "My Ambassadors" lead modal ───────────────────────────────────────────
# GET /integrations/crm/ambassadors/{id}/leads backs the CRM's read-only modal.
# The CRM cannot answer "which leads belong to this ambassador" from its own data
# (affiliate leads land there with referral_leads.referrer_id = NULL by design),
# so this endpoint is the only source of that attribution.

def test_crm_ambassador_leads_requires_service_key():
    _register("admin_al0@bheuni.ac.uk", "Admin AL0")   # first registrant = admin
    stud = _hdr(_register_simple("stud_al1@bheuni.ac.uk"))
    uid = client.get("/auth/me", headers=stud).json()["id"]
    settings.CRM_SERVICE_KEY = "test-crm-key"
    # No key, and a wrong key, are both rejected before any data is touched.
    assert client.get(f"/integrations/crm/ambassadors/{uid}/leads").status_code == 401
    assert client.get(f"/integrations/crm/ambassadors/{uid}/leads",
                      headers={"X-CRM-Service-Key": "wrong"}).status_code == 401


def test_crm_ambassador_leads_unknown_ambassador_404s():
    settings.CRM_SERVICE_KEY = "test-crm-key"
    good = {"X-CRM-Service-Key": "test-crm-key"}
    r = client.get("/integrations/crm/ambassadors/does-not-exist/leads", headers=good)
    # 404 rather than an empty list, so the CRM can say "not found" instead of
    # rendering a modal that looks like "this ambassador has no leads".
    assert r.status_code == 404


def test_crm_ambassador_leads_returns_every_lead_and_no_money():
    _register("admin_al@bheuni.ac.uk", "Admin AL")
    stud = _hdr(_register_simple("stud_al2@bheuni.ac.uk"))
    me = client.get("/auth/me", headers=stud).json()
    uid, ref_code = me["id"], me["referral_code"]

    settings.CRM_SERVICE_KEY = "test-crm-key"
    good = {"X-CRM-Service-Key": "test-crm-key"}
    base = {"referral_code": ref_code, "lead_email": "f@e.com", "source": "crm"}

    # One qualified lead and one rejected lead.
    client.post("/integrations/crm/lead-event",
                json={**base, "event": "lead_qualified", "external_lead_id": "al-1",
                      "lead_name": "Kept Lead"}, headers=good)
    client.post("/integrations/crm/lead-event",
                json={**base, "event": "lead_rejected", "external_lead_id": "al-2",
                      "lead_name": "Rejected Lead", "reason": "Duplicate"}, headers=good)

    r = client.get(f"/integrations/crm/ambassadors/{uid}/leads", headers=good)
    assert r.status_code == 200, r.text
    body = r.json()

    # REJECTED LEADS MUST BE INCLUDED: a counsellor needs the ambassador's true
    # output, not a flattering subset.
    assert body["count"] == 2
    names = {l["lead_name"] for l in body["leads"]}
    assert names == {"Kept Lead", "Rejected Lead"}

    rejected = next(l for l in body["leads"] if l["lead_name"] == "Rejected Lead")
    assert rejected["rejection_reason"] == "Duplicate"

    # The CRM joins on external_lead_id to add assign_date and the handover trail.
    assert {l["external_lead_id"] for l in body["leads"]} == {"al-1", "al-2"}

    # NO money, rewards or banking may ever cross to the CRM, mirroring the
    # existing _CRM_AMBASSADOR_FIELDS allow-list.
    forbidden = ("reward", "paid", "wallet", "earned", "bank", "amount", "installment")
    for lead in body["leads"]:
        for key in lead:
            assert not any(f in key for f in forbidden), f"money field leaked: {key}"
    for key in body["ambassador"]:
        assert not any(f in key for f in forbidden), f"money field leaked: {key}"


def test_crm_ambassador_leads_scoped_to_one_ambassador():
    # The FIRST registrant in a clean DB becomes an admin, not a student, so seed
    # one before creating the two ambassadors (see _register_simple's docstring).
    _register("admin_al2@bheuni.ac.uk", "Admin AL2")
    stud_a = _hdr(_register_simple("stud_al3@bheuni.ac.uk"))
    stud_b = _hdr(_register_simple("stud_al4@bheuni.ac.uk"))
    a = client.get("/auth/me", headers=stud_a).json()
    b = client.get("/auth/me", headers=stud_b).json()

    settings.CRM_SERVICE_KEY = "test-crm-key"
    good = {"X-CRM-Service-Key": "test-crm-key"}
    for code, ext, name in ((a["referral_code"], "al-a1", "A Lead"),
                            (b["referral_code"], "al-b1", "B Lead")):
        client.post("/integrations/crm/lead-event",
                    json={"event": "lead_qualified", "external_lead_id": ext,
                          "referral_code": code, "lead_email": "f@e.com",
                          "lead_name": name, "source": "crm"}, headers=good)

    # Ambassador A must never see ambassador B's leads.
    ra_resp = client.get(f"/integrations/crm/ambassadors/{a['id']}/leads", headers=good)
    assert ra_resp.status_code == 200, ra_resp.text
    assert [l["lead_name"] for l in ra_resp.json()["leads"]] == ["A Lead"]
    rb_resp = client.get(f"/integrations/crm/ambassadors/{b['id']}/leads", headers=good)
    assert rb_resp.status_code == 200, rb_resp.text
    assert [l["lead_name"] for l in rb_resp.json()["leads"]] == ["B Lead"]

# Manual BDT payout flows: bank, bKash and other services.
def _manual_payout_setup(tag):
    _register(f"admin_{tag}@bheuni.ac.uk", "Finance Admin")
    admin = _hdr(_login(f"admin_{tag}@bheuni.ac.uk"))
    email = f"student_{tag}@bheuni.ac.uk"
    student = _hdr(_register_simple(email))
    _credit_wallet(email, 500)
    return admin, student


def _bkash_payload(key="bkash-test-key-001"):
    return {"amount": "100.00", "payment_method": "bkash", "request_key": key,
        "bank_details": {"holder_name": "Demo Ambassador", "account_number": "01712345678", "account_type": "personal"}}


def test_payout_bkash_manual_processing_paid_and_receipt(monkeypatch):
    admin, student = _manual_payout_setup("bkashmanual")
    # Even a configured auto-pay threshold cannot silently settle manual payouts.
    monkeypatch.setattr(settings, "PAYOUT_AUTO_APPROVE_UNDER", "1000")
    response = client.post("/ambassador/payouts", json=_bkash_payload(), headers=student)
    assert response.status_code == 201, response.text
    payout = response.json()
    assert payout["status"] == "pending"
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 400
    processing = client.put(f"/admin/payouts/{payout['id']}/status", json={"status":"processing"}, headers=admin)
    assert processing.status_code == 200 and processing.json()["processing_at"]
    missing_ref = client.put(f"/admin/payouts/{payout['id']}/status", json={"status":"paid"}, headers=admin)
    assert missing_ref.status_code == 400
    paid = client.put(f"/admin/payouts/{payout['id']}/status", json={"status":"paid", "payment_reference":"BKASH-TXN-123"}, headers=admin)
    assert paid.status_code == 200 and paid.json()["provider_ref"] == "BKASH-TXN-123"
    receipt = client.get(f"/ambassador/payouts/{payout['id']}/receipt", headers=student)
    assert receipt.status_code == 200 and receipt.content.startswith(b"%PDF")
    again = client.put(f"/admin/payouts/{payout['id']}/status", json={"status":"failed", "status_note":"No duplicate refund"}, headers=admin)
    assert again.status_code == 400
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 400


def test_payout_manual_failure_refunds_once():
    admin, student = _manual_payout_setup("manualfail")
    payout = client.post("/ambassador/payouts", json=_bkash_payload(), headers=student).json()
    url = f"/admin/payouts/{payout['id']}/status"
    assert client.put(url, json={"status":"processing"}, headers=admin).status_code == 200
    assert client.put(url, json={"status":"failed"}, headers=admin).status_code == 400
    failed = client.put(url, json={"status":"failed","status_note":"Recipient account unavailable"}, headers=admin)
    assert failed.status_code == 200 and failed.json()["status_note"] == "Recipient account unavailable"
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 500
    assert client.put(url, json={"status":"cancelled"}, headers=admin).status_code == 400
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 500


def test_payout_manual_retry_idempotency_and_validation():
    admin, student = _manual_payout_setup("manualretry")
    payload = _bkash_payload()
    first = client.post("/ambassador/payouts", json=payload, headers=student)
    again = client.post("/ambassador/payouts", json=payload, headers=student)
    assert first.status_code == again.status_code == 201
    assert first.json()["id"] == again.json()["id"]
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 400
    payload["amount"] = "101.00"
    assert client.post("/ambassador/payouts", json=payload, headers=student).status_code == 409
    payload["request_key"] = "new-bkash-validation-key"
    payload["bank_details"]["account_number"] = "invalid"
    assert client.post("/ambassador/payouts", json=payload, headers=student).status_code == 400
    payload["amount"] = "100.001"
    assert client.post("/ambassador/payouts", json=payload, headers=student).status_code == 422


def test_payout_saved_accounts_and_bd_bank():
    admin, student = _manual_payout_setup("savedbank")
    details = {"holder_name":"Demo Ambassador", "bank_name":"Dutch-Bangla Bank", "branch":"Dhanmondi", "routing_number":"090260001", "account_number":"1234567890"}
    saved = client.post("/ambassador/payout-accounts", json={"payment_method":"bank_transfer", "details":details}, headers=student)
    assert saved.status_code == 201, saved.text
    accounts = client.get("/ambassador/payout-accounts", headers=student).json()
    assert accounts[0]["details"]["routing_number"] == "090260001"
    payout = client.post("/ambassador/payouts", json={"amount":100,"payment_method":"bank_transfer", "bank_details":details}, headers=student)
    assert payout.status_code == 201, payout.text
    assert payout.json()["status"] == "pending"
    assert client.delete(f"/ambassador/payout-accounts/{saved.json()['id']}", headers=student).status_code == 204
    assert client.get("/ambassador/payout-accounts", headers=student).json() == []
    # A saved payout snapshot survives removal of a reusable account.
    assert client.get("/ambassador/payouts", headers=student).json()[0]["bank_details"]["account_number"] == "1234567890"


def test_payout_other_manual_and_owner_controls():
    admin, student = _manual_payout_setup("othermanual")
    other = _hdr(_register_simple("other_manual_owner@bheuni.ac.uk"))
    body = {"amount":100,"payment_method":"other","bank_details":{"holder_name":"Demo", "provider_name":"Nagad", "account_number":"01812345678"}}
    request = client.post("/ambassador/payouts", json=body, headers=student)
    assert request.status_code == 201, request.text
    payout_id = request.json()["id"]
    assert client.post(f"/ambassador/payouts/{payout_id}/cancel", json={}, headers=other).status_code == 404
    assert client.get(f"/ambassador/payouts/{payout_id}/receipt", headers=other).status_code == 404
    assert client.put(f"/admin/payouts/{payout_id}/status", json={"status":"paid"}, headers=student).status_code == 403
    cancel = client.post(f"/ambassador/payouts/{payout_id}/cancel", json={}, headers=student)
    assert cancel.status_code == 200
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 500
    assert client.post(f"/ambassador/payouts/{payout_id}/cancel", json={}, headers=student).status_code == 400


def test_payout_concurrent_requests_cannot_overdraw():
    from concurrent.futures import ThreadPoolExecutor
    admin, student = _manual_payout_setup("racebalance")
    def request(index):
        payload = _bkash_payload(f"concurrent-balance-key-{index}")
        payload["amount"] = "400.00"
        return client.post("/ambassador/payouts", json=payload, headers=student)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(request, [1,2]))
    assert sorted(r.status_code for r in results) == [201,400]
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 100


def test_payout_concurrent_duplicate_submit_and_refund():
    from concurrent.futures import ThreadPoolExecutor
    admin, student = _manual_payout_setup("raceidempotency")
    def request(_):
        return client.post("/ambassador/payouts", json=_bkash_payload("concurrent-duplicate-key"), headers=student)
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(request, [1,2]))
    assert all(response.status_code == 201 for response in responses), [r.text for r in responses]
    assert responses[0].json()["id"] == responses[1].json()["id"]
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 400
    payout_id = responses[0].json()["id"]
    def refund(_):
        return client.put(f"/admin/payouts/{payout_id}/status", json={"status":"cancelled", "status_note":"Duplicate admin clicks"}, headers=admin)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(refund, [1,2]))
    assert sum(r.status_code == 200 for r in results) == 1
    assert all(r.status_code in (200,400,409) for r in results)
    assert float(client.get("/ambassador/stats", headers=student).json()["wallet_balance"]) == 500
