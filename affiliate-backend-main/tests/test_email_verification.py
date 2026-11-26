from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main, models
from app.core import mail
from app.core.database import Base, get_db


@pytest.fixture
def auth_env(monkeypatch):
    monkeypatch.setattr(main.settings, "LOCAL_SIGNUP_TEST_MODE", False)
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    def database():
        with sessions() as db:
            yield db
    previous = dict(main.app.dependency_overrides)
    main.app.dependency_overrides[get_db] = database
    main._RL_BUCKETS.clear()
    sent = []
    def send(to, name, code, *, purpose):
        sent.append((to, code, purpose))
        return True
    monkeypatch.setattr(mail, "send_otp_email", send)
    from app.core import phone_verification
    def send_sms(phone, code):
        sent.append((phone, code, "google_phone"))
        return True
    monkeypatch.setattr(phone_verification, "send_phone_code", send_sms)
    monkeypatch.setattr(mail, "_send_email", lambda *args, **kwargs: True)
    # Account creation must not contact external marketing services in tests.
    from app import crud
    monkeypatch.setattr(crud, "_welcome_ambassador", lambda user: None)
    with TestClient(main.app) as client:
        yield client, sessions, sent
    main.app.dependency_overrides.clear()
    main.app.dependency_overrides.update(previous)
    engine.dispose()


def profile(email="verified@example.com"):
    return dict(email=email, first_name="Verified", last_name="User", phone="07123456789",
                password="StrongPassword123", policy_accepted=True,
                university="University of Dhaka", department_year="BBA, 3rd year",
                counsellor_id="counsellor-1", counsellor_name="Test Counsellor")


def start(client, email="verified@example.com"):
    return client.post("/auth/register/initiate", json={"email": email, "full_name": "Verified User"})


def test_registration_requires_code_and_preserves_profile(auth_env):
    client, sessions, sent = auth_env
    data = {**profile(), "university": "University of Dhaka", "department_year": "BBA, 3rd year"}
    assert client.post("/auth/register/simple", json=data).status_code == 400
    assert client.post("/auth/register", json={"email": data['email'], "full_name": "User", "password": data['password']}).status_code == 400
    assert start(client).status_code == 200
    with sessions() as db:
        assert db.query(models.User).count() == 0
    assert sent[-1][2] == 'registration'
    response = client.post('/auth/register/verify', json={'email': data['email'], 'otp': sent[-1][1]})
    assert response.status_code == 200
    data['verification_token'] = response.json()['verification_token']
    assert client.post('/auth/register/simple', json={**data, 'email': 'other@example.com'}).status_code == 400
    response = client.post('/auth/register/simple', json=data)
    assert response.status_code == 201
    assert client.post('/auth/register/simple', json=data).status_code == 400
    with sessions() as db:
        user = db.query(models.User).one()
        assert user.university == data['university']
        assert user.department_year == data['department_year']
        assert user.phone == data['phone']
        assert user.counsellor_id == data['counsellor_id']
        assert user.policy_accepted_at is not None
        assert db.query(models.OTPVerification).count() == 0


def test_failed_delivery_does_not_claim_sent_or_create_code(auth_env, monkeypatch):
    client, sessions, _ = auth_env
    monkeypatch.setattr(mail, 'send_otp_email', lambda *a, **k: False)
    assert start(client).status_code == 503
    with sessions() as db:
        assert db.query(models.OTPVerification).count() == 0
        assert db.query(models.User).count() == 0


def test_resend_invalidates_previous_code_and_limits_attempts(auth_env):
    client, sessions, sent = auth_env
    assert start(client).status_code == 200
    assert start(client).status_code == 429
    with sessions() as db:
        entry = db.query(models.OTPVerification).one()
        entry.created_at = datetime.utcnow() - timedelta(minutes=2)
        entry.otp_code = 'old-code'
        db.commit()
    assert start(client).status_code == 200
    code = sent[-1][1]
    wrong = '000000' if code != '000000' else '999999'
    with sessions() as db:
        assert db.query(models.OTPVerification).count() == 1
    for _ in range(5):
        assert client.post('/auth/register/verify', json={'email': sent[-1][0], 'otp': wrong}).status_code == 400
    assert client.post('/auth/register/verify', json={'email': sent[-1][0], 'otp': code}).status_code == 400


def test_expired_code_and_proof_rejected(auth_env):
    client, sessions, sent = auth_env
    start(client)
    with sessions() as db:
        entry = db.query(models.OTPVerification).one()
        entry.expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.commit()
    assert client.post('/auth/register/verify', json={'email': sent[-1][0], 'otp': sent[-1][1]}).status_code == 400
    with sessions() as db:
        entry = db.query(models.OTPVerification).one()
        entry.is_verified = True
        entry.verification_token = 'expired-proof'
        db.commit()
    assert client.post('/auth/register/simple', json={**profile(), 'verification_token': 'expired-proof'}).status_code == 400
    assert client.post('/auth/register/complete', json={'email': sent[-1][0], 'password': 'StrongPassword123', 'verification_token': 'expired-proof'}).status_code == 400


def test_reset_code_is_separate_single_use_and_revokes_old_session(auth_env):
    client, sessions, sent = auth_env
    start(client)
    data = profile()
    code = sent[-1][1]
    # A signup code cannot reset a password.
    assert client.post('/auth/reset-password', json={'email': data['email'], 'otp': code, 'password': 'NewPassword123'}).status_code == 400
    data['verification_token'] = client.post('/auth/register/verify', json={'email': data['email'], 'otp': code}).json()['verification_token']
    old_token = client.post('/auth/register/simple', json=data).json()['access_token']
    assert client.post('/auth/forgot-password', json={'email': data['email']}).status_code == 200
    assert sent[-1][2] == 'password_reset'
    reset = {'email': data['email'], 'otp': sent[-1][1], 'password': 'NewPassword123'}
    assert client.post('/auth/register/verify', json={'email': data['email'], 'otp': sent[-1][1]}).status_code == 400
    assert client.post('/auth/reset-password', json=reset).status_code == 200
    assert client.post('/auth/reset-password', json=reset).status_code == 400
    assert client.get('/auth/me', headers={'Authorization': 'Bearer '+old_token}).status_code == 401
    assert client.post('/auth/login', json={'email': data['email'], 'password': 'NewPassword123'}).status_code == 200


def test_auth_email_sender_and_content(monkeypatch, capsys):
    deliveries = []
    monkeypatch.setattr(mail, '_send_email', lambda *a, **k: deliveries.append((a,k)) or True)
    for purpose in ['registration', 'password_reset']:
        assert mail.send_otp_email('test@example.com', '<User>', '123456', purpose=purpose)
        args, kwargs = deliveries[-1]
        assert kwargs['from_address'] == 'no-reply@bheuni.io'
        assert '123456' not in args[1]
        assert '123456' in args[2]
        assert '&lt;User&gt;' in args[3]
    assert '123456' not in capsys.readouterr().out


def test_otp_migration_invalidates_legacy_codes(monkeypatch):
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE otp_verifications (id TEXT PRIMARY KEY)'))
        connection.execute(text("INSERT INTO otp_verifications VALUES ('old')"))
    monkeypatch.setattr(main, 'engine', engine)
    main._ensure_otp_columns()
    main._ensure_otp_columns()
    with engine.connect() as connection:
        row = connection.execute(text('SELECT purpose, attempts FROM otp_verifications')).one()
        assert row == ('legacy', 0)


def test_mailersend_auth_sender_overrides_general_sender(monkeypatch):
    import json
    requests = []
    class Response:
        status = 202
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
    def deliver(request, **kwargs):
        requests.append(json.loads(request.data))
        return Response()
    monkeypatch.setattr(mail.urllib.request, 'urlopen', deliver)
    monkeypatch.setattr(mail.settings, 'MAILERSEND_API_TOKEN', 'test-token')
    monkeypatch.setattr(mail.settings, 'MAILERSEND_FROM_ADDRESS', 'other@example.com')
    assert mail.send_otp_email('test@example.com', 'Test', '123456')
    assert requests[0]['from']['email'] == 'no-reply@bheuni.io'


def test_failed_reset_delivery_does_not_claim_success(auth_env, monkeypatch):
    client, sessions, sent = auth_env
    start(client)
    data = profile()
    data['verification_token'] = client.post('/auth/register/verify', json={'email': data['email'], 'otp': sent[-1][1]}).json()['verification_token']
    client.post('/auth/register/simple', json=data)
    monkeypatch.setattr(mail, 'send_otp_email', lambda *a, **k: False)
    assert client.post('/auth/forgot-password', json={'email': data['email']}).status_code == 503
    with sessions() as db:
        assert db.query(models.OTPVerification).filter_by(purpose='password_reset').count() == 0


def test_local_dummy_signup_uses_fixed_code_and_saves_profile(auth_env, monkeypatch):
    client, sessions, sent = auth_env
    monkeypatch.setattr(main.settings, "LOCAL_SIGNUP_TEST_MODE", True)
    assert client.get("/auth/signup-mode").json() == {"test_mode": True}
    options = client.get("/auth/counsellors").json()
    assert len(options) == 21
    data = {**profile("dummy@example.com"), "university": "Test University", "department_year": "BBA, 3rd year", "counsellor_id": options[0]["id"], "counsellor_name": options[0]["name"]}
    assert start(client, data["email"]).status_code == 200
    assert sent == []
    response = client.post("/auth/register/verify", json={"email": data["email"], "otp": "123456"})
    assert response.status_code == 200
    data["verification_token"] = response.json()["verification_token"]
    assert client.post("/auth/register/simple", json=data).status_code == 201
    login = client.post("/auth/login", json={"email": data["email"], "password": data["password"]})
    assert login.status_code == 200
    me = client.get("/auth/me", headers={"Authorization": "Bearer " + login.json()["access_token"]}).json()
    assert me["university"] == "Test University"
    assert me["counsellor_id"] == options[0]["id"]
    assert me["role"] == "student"
    with sessions() as db:
        user = db.query(models.User).filter_by(email=data["email"]).one()
        from app.demo_data import seed_demo_for_user
        seed_demo_for_user(db, user)
        assert db.query(models.Referral).filter_by(referrer_id=user.id).count() == 12
        assert db.query(models.Payout).filter_by(user_id=user.id).count() == 2
        assert len(user.bank_details["payout_accounts"]) == 1


@pytest.mark.parametrize("field", ["first_name", "phone"])
def test_signup_rejects_missing_required_fields(auth_env, field):
    client, _, _ = auth_env
    data = profile()
    data[field] = "   "
    assert client.post("/auth/register/simple", json=data).status_code == 422
    del data[field]
    assert client.post("/auth/register/simple", json=data).status_code == 422


def test_google_signup_requires_phone_verification_before_login(auth_env, monkeypatch):
    from app.api import auth
    client, sessions, sent = auth_env
    monkeypatch.setattr(auth, "_google_identity", lambda credential: {"email":"google@example.com", "name":"Nusrat Jahan", "email_verified":True})
    prepared = client.post("/auth/google/prepare", json={"credential":"valid"}).json()
    token = prepared["verification_token"]
    data = {"verification_token":token, "otp":"123456", "policy_accepted":True}
    assert client.post("/auth/google", json={"credential":"valid"}).status_code == 409
    assert client.post("/auth/google/complete", json=data).status_code == 400
    assert client.post("/auth/google/complete", json=profile("google@example.com")).status_code == 422
    assert client.post("/auth/google/phone/send", json={"verification_token":token, "phone":"01712345678"}).status_code == 200
    data["otp"] = sent[-1][1]
    assert client.post("/auth/google/complete", json={**data,"policy_accepted":False}).status_code == 400
    assert client.post("/auth/google/complete", json={**data,"otp":"000000" if data["otp"] != "000000" else "111111"}).status_code == 400
    assert client.post("/auth/google/complete", json={**data,"full_name":"Spoofed Name","email":"spoof@example.com"}).status_code == 200
    assert client.post("/auth/google/complete", json=data).status_code == 400
    assert client.post("/auth/google", json={"credential":"valid"}).status_code == 200
    returning = client.post("/auth/google/prepare", json={"credential":"valid"}).json()
    assert returning["needs_profile"] is False
    assert returning["access_token"]
    assert client.get("/auth/me", headers={"Authorization":"Bearer " + returning["access_token"]}).status_code == 200
    with sessions() as db:
        user = db.query(models.User).one()
        assert user.full_name == "Nusrat Jahan" and user.email == "google@example.com"
        assert user.phone == "+8801712345678" and user.phone_verified_at is not None
        assert user.role == models.UserRole.student
        assert user.counsellor_id is None
        assert db.query(models.GooglePhoneChallenge).count() == 0


def test_google_requires_configured_client_and_verified_email(auth_env, monkeypatch):
    from app.api import auth
    from google.oauth2 import id_token
    client, _, _ = auth_env
    monkeypatch.setattr(auth.settings,"GOOGLE_CLIENT_ID", "")
    assert client.post("/auth/google/prepare", json={"credential":"anything"}).status_code == 503
    monkeypatch.setattr(auth.settings,"GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(id_token,"verify_oauth2_token",lambda *args,**kwargs: {"email":"google@example.com","email_verified":False})
    assert client.post("/auth/google/prepare", json={"credential":"anything"}).status_code == 400


def test_google_existing_incomplete_account_finishes_profile(auth_env, monkeypatch):
    from app.api import auth
    client, sessions, _ = auth_env
    monkeypatch.setattr(auth, "_google_identity", lambda credential: {"email":"returning@example.com","name":"Returning User","email_verified":True})
    from app.core.security import get_password_hash
    with sessions() as db:
        db.add(models.User(email="returning@example.com", full_name="Returning User", password_hash=get_password_hash("OldPassword123"), referral_code="RET123", role=models.UserRole.student))
        db.commit()
    proof = client.post("/auth/google/prepare", json={"credential":"valid"}).json()
    assert proof["needs_profile"] is True
    assert client.post("/auth/google/phone/send", json={"verification_token":proof["verification_token"], "phone":"01712345678"}).status_code == 200
    with sessions() as db:
        challenge = db.query(models.GooglePhoneChallenge).one()
        assert challenge.phone == "+8801712345678"
    result = client.post("/auth/google/complete", json={"verification_token":proof["verification_token"], "otp":auth_env[2][-1][1], "policy_accepted":True})
    assert result.status_code == 200
    returning = client.post("/auth/google/prepare", json={"credential":"valid"}).json()
    assert returning["needs_profile"] is False
    assert returning["access_token"]
    assert client.get("/auth/me", headers={"Authorization":"Bearer " + returning["access_token"]}).status_code == 200
    with sessions() as db:
        assert db.query(models.User).count() == 1


def test_google_demo_is_test_only_and_completes_profile(auth_env, monkeypatch):
    from app.api import auth
    client, _, sent = auth_env
    assert client.post("/auth/google/demo").status_code == 404
    monkeypatch.setattr(auth.settings, "LOCAL_SIGNUP_TEST_MODE", True)
    demo = client.post("/auth/google/demo").json()
    assert demo["email"].endswith("@example.com")
    assert sent == []
    assert client.post("/auth/google/phone/send", json={"verification_token":demo["verification_token"], "phone":"01712345678"}).status_code == 200
    result = client.post("/auth/google/complete", json={"verification_token":demo["verification_token"], "otp":"123456", "policy_accepted":True})
    assert result.status_code == 200
    assert client.post("/auth/login", json={"email":demo["email"],"password":"StrongPassword123"}).status_code == 400


def test_dummy_password_reset_uses_fixed_code(auth_env, monkeypatch):
    from app.api import auth
    client, _, sent = auth_env
    monkeypatch.setattr(auth.settings, "LOCAL_SIGNUP_TEST_MODE", True)
    demo = client.post("/auth/google/demo").json()
    data = {**profile(demo["email"]), "verification_token":demo["verification_token"]}
    assert client.post("/auth/google/phone/send", json={"verification_token":demo["verification_token"], "phone":"01712345678"}).status_code == 200
    assert client.post("/auth/google/complete", json={"verification_token":demo["verification_token"], "otp":"123456", "policy_accepted":True}).status_code == 200
    assert client.post("/auth/forgot-password", json={"email":data["email"]}).status_code == 200
    assert sent == []
    assert client.post("/auth/reset-password", json={"email":data["email"],"otp":"000000","password":"NewPassword123"}).status_code == 400
    assert client.post("/auth/reset-password", json={"email":data["email"],"otp":"123456","password":"NewPassword123"}).status_code == 200
    assert client.post("/auth/login", json={"email":data["email"],"password":"NewPassword123"}).status_code == 200
    assert client.post("/auth/login", json={"email":data["email"],"password":data["password"]}).status_code == 400


@pytest.mark.parametrize("email_value", [None, "", "invalid", "omitted"])
def test_signup_requires_email_even_without_counsellor(auth_env, email_value):
    client, sessions, sent = auth_env
    data = profile()
    data.pop("counsellor_id")
    data.pop("counsellor_name")
    if email_value == "omitted":
        data.pop("email")
    else:
        data["email"] = email_value
    assert client.post("/auth/register/simple", json=data).status_code == 422
    assert sent == []
    with sessions() as db:
        assert db.query(models.User).count() == 0


def test_verified_email_signup_without_counsellor(auth_env):
    client, _, sent = auth_env
    data = profile()
    data.pop("counsellor_id")
    data.pop("counsellor_name")
    assert start(client).status_code == 200
    verified = client.post("/auth/register/verify", json={"email":data["email"], "otp":sent[-1][1]})
    data["verification_token"] = verified.json()["verification_token"]
    assert client.post("/auth/register/simple", json=data).status_code == 201


def test_optional_email_migration_preserves_records_and_references():
    from app.core.optional_email import ensure_optional_email
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE users (id TEXT PRIMARY KEY, email VARCHAR NOT NULL UNIQUE, legacy TEXT)"))
        conn.execute(text("CREATE INDEX ix_users_email ON users(email)"))
        conn.execute(text("CREATE TABLE child (user_id TEXT REFERENCES users(id))"))
        conn.execute(text("INSERT INTO users VALUES ('old', 'old@example.com', 'keep me')"))
        conn.execute(text("INSERT INTO child VALUES ('old')"))
    ensure_optional_email(engine)
    ensure_optional_email(engine)
    with engine.begin() as conn:
        assert conn.execute(text("SELECT legacy FROM users WHERE id='old'")).scalar() == "keep me"
        assert conn.execute(text("SELECT user_id FROM child")).scalar() == "old"
        conn.execute(text("INSERT INTO users VALUES ('new', NULL, NULL), ('another', NULL, NULL)"))
        assert conn.execute(text("PRAGMA foreign_key_check")).all() == []
        assert conn.execute(text("SELECT count(*) FROM sqlite_master WHERE name='ix_users_email'")).scalar() == 1
    engine.dispose()


@pytest.mark.parametrize("google", [False, True])
def test_signup_without_education_fields(auth_env, monkeypatch, google):
    from app.api import auth
    client, sessions, sent = auth_env
    data = profile()
    data.pop("university")
    data.pop("department_year")
    if google:
        monkeypatch.setattr(auth, "_google_identity", lambda credential: {"email":data["email"], "name":"Test User", "email_verified":True})
        proof = client.post("/auth/google/prepare", json={"credential":"test"}).json()["verification_token"]
    else:
        assert start(client).status_code == 200
        proof = client.post("/auth/register/verify", json={"email":data["email"], "otp":sent[-1][1]}).json()["verification_token"]
    if google:
        assert client.post("/auth/google/phone/send", json={"verification_token":proof, "phone":"01712345678"}).status_code == 200
        response = client.post("/auth/google/complete", json={"verification_token":proof, "otp":sent[-1][1], "policy_accepted":True})
    else:
        response = client.post("/auth/register/simple", json={**data, "verification_token":proof})
    assert response.status_code == (200 if google else 201), response.text
    with sessions() as db:
        user = db.query(models.User).one()
        assert user.university is None and user.department_year is None
        assert auth._google_profile_complete(user) == google
    if google:
        assert client.post("/auth/google", json={"credential":"test"}).status_code == 200


def test_google_phone_expiry_attempts_and_cooldown(auth_env, monkeypatch):
    from app.api import auth
    client, sessions, sent = auth_env
    monkeypatch.setattr(auth, "_google_identity", lambda credential: {"email":"phone@example.com", "name":"Google Name", "email_verified":True})
    token = client.post("/auth/google/prepare", json={"credential":"valid"}).json()["verification_token"]
    send = {"verification_token":token, "phone":"01712345678"}
    assert client.post("/auth/google/phone/send", json={**send,"phone":"abc"}).status_code == 400
    assert client.post("/auth/google/phone/send", json=send).status_code == 200
    assert sent[-1][0] == "+8801712345678"
    assert client.post("/auth/google/phone/send", json=send).status_code == 429
    # Creating another Google proof cannot bypass the identity/phone cooldown.
    another = client.post("/auth/google/prepare", json={"credential":"valid"}).json()["verification_token"]
    assert client.post("/auth/google/phone/send", json={**send,"verification_token":another}).status_code == 429
    data = {"verification_token":token,"otp":"000000" if sent[-1][1] != "000000" else "111111","policy_accepted":True}
    for _ in range(5):
        assert client.post("/auth/google/complete", json=data).status_code == 400
    assert client.post("/auth/google/complete", json={**data,"otp":sent[-1][1]}).status_code == 400
    with sessions() as db:
        challenge = db.get(models.GooglePhoneChallenge, token)
        assert challenge.code_hash != sent[-1][1]
        challenge.created_at = datetime.utcnow() - timedelta(minutes=2)
        db.commit()
    assert client.post("/auth/google/phone/send", json=send).status_code == 200
    with sessions() as db:
        challenge = db.get(models.GooglePhoneChallenge, token)
        challenge.expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.commit()
    assert client.post("/auth/google/complete", json={**data,"otp":sent[-1][1]}).status_code == 400
    with sessions() as db:
        assert db.query(models.User).count() == 0


def test_google_phone_delivery_failure_and_duplicate_number(auth_env, monkeypatch):
    from app.api import auth
    from app.core import phone_verification
    client, sessions, _ = auth_env
    monkeypatch.setattr(auth, "_google_identity", lambda credential: {"email":"phone@example.com", "name":"Google Name", "email_verified":True})
    token = client.post("/auth/google/prepare", json={"credential":"valid"}).json()["verification_token"]
    data = {"verification_token":token,"phone":"01712345678"}
    monkeypatch.setattr(phone_verification,"send_phone_code",lambda *args:False)
    assert client.post("/auth/google/phone/send", json=data).status_code == 503
    with sessions() as db:
        assert db.query(models.GooglePhoneChallenge).count() == 0
        db.add(models.User(email="other@example.com", full_name="Other User", phone="+8801712345678", password_hash="unused", referral_code="OTHER", role=models.UserRole.student))
        db.commit()
    assert client.post("/auth/google/phone/send", json=data).status_code == 409
    assert client.post("/auth/google/phone/send", json={**data,"verification_token":"fake"}).status_code == 400



def test_google_demo_returning_user_skips_signup(auth_env, monkeypatch):
    from app.api import auth
    client, sessions, _ = auth_env
    monkeypatch.setattr(auth.settings, "LOCAL_SIGNUP_TEST_MODE", True)
    demo_id = "a" * 32
    first = client.post("/auth/google/demo", json={"demo_id":demo_id}).json()
    token = first["verification_token"]
    assert first["needs_profile"] is True
    assert client.post("/auth/google/phone/send", json={"verification_token":token,"phone":"01712345678"}).status_code == 200
    assert client.post("/auth/google/complete", json={"verification_token":token,"otp":"123456","policy_accepted":True}).status_code == 200
    for _ in range(2):
        returning = client.post("/auth/google/demo", json={"demo_id":demo_id}).json()
        assert returning["needs_profile"] is False
        assert "verification_token" not in returning
        assert client.get("/auth/me", headers={"Authorization":"Bearer " + returning["access_token"]}).status_code == 200
    with sessions() as db:
        assert db.query(models.User).count() == 1
        assert db.query(models.GooglePhoneChallenge).count() == 0
    monkeypatch.setattr(auth.settings, "LOCAL_SIGNUP_TEST_MODE", False)
    assert client.post("/auth/google/demo", json={"demo_id":demo_id}).status_code == 404
