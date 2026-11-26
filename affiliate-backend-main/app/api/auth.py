from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.config import settings
from app import crud, models, schemas
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def _registration_proof(db, email, token, purpose="registration"):
    from datetime import datetime
    proof = db.query(models.OTPVerification).filter(
        models.OTPVerification.email == email,
        models.OTPVerification.purpose == purpose,
        models.OTPVerification.verification_token == token,
        models.OTPVerification.is_verified == True,
        models.OTPVerification.expires_at > datetime.utcnow(),
    ).first() if token else None
    if not proof:
        raise HTTPException(400, "Please verify your email before creating an account.")
    return proof


def _send_auth_code(db, email, full_name, purpose):
    import secrets
    from datetime import datetime, timedelta
    from app.core.mail import send_otp_email
    now = datetime.utcnow()
    previous = db.query(models.OTPVerification).filter_by(email=email, purpose=purpose).all()
    if any(entry.created_at.replace(tzinfo=None) > now - timedelta(seconds=60) for entry in previous):
        raise HTTPException(429, "Please wait 60 seconds before requesting another code.")
    local_test = settings.LOCAL_SIGNUP_TEST_MODE and purpose in ("registration", "password_reset")
    code = "123456" if local_test else f"{secrets.randbelow(1000000):06d}"
    entry = models.OTPVerification(
        email=email, full_name=full_name, purpose=purpose, otp_code=code,
        expires_at=now + timedelta(minutes=10),
    )
    if not local_test and not send_otp_email(email, full_name, code, purpose=purpose):
        raise HTTPException(503, "We couldn't send your verification email. Please try again shortly.")
    for old in previous:
        db.delete(old)
    db.add(entry)
    db.commit()


def _verify_auth_code(db, email, code, purpose):
    import secrets
    from datetime import datetime
    entry = db.query(models.OTPVerification).filter(
        models.OTPVerification.email == email,
        models.OTPVerification.purpose == purpose,
        models.OTPVerification.is_verified == False,
        models.OTPVerification.expires_at > datetime.utcnow(),
    ).order_by(models.OTPVerification.created_at.desc()).first()
    if not entry or entry.attempts >= 5:
        raise HTTPException(400, "Invalid or expired code. Please request a new code.")
    if not secrets.compare_digest(entry.otp_code, code):
        entry.attempts += 1
        db.commit()
        raise HTTPException(400, "Invalid or expired code. Please request a new code.")
    return entry


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(user_id=user_id, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
        
    user = crud.get_user(db, user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    # Session invalidation: reject any token whose version is behind the user's
    # current token_version (bumped on password change / admin session reset).
    # Tokens issued before this feature carry no "ver" claim → treated as 0.
    if int(payload.get("ver", 0)) != int(getattr(user, "token_version", 0) or 0):
        raise credentials_exception
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_student(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    proof = _registration_proof(db, user_in.email, user_in.verification_token)
    db_user = crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists in the system."
        )
        
    # If it is the very first user registered, we can optionally make them an admin for convenience in testing.
    # Otherwise standard student registration.
    is_first_user = db.query(models.User).count() == 0
    db.delete(proof)
    return crud.create_user(db, user=user_in, is_first_admin=is_first_user)


@router.post("/register/initiate")
def register_initiate(data: schemas.UserRegisterInitiate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = crud.get_user_by_email(db, email=data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    _send_auth_code(db, data.email, data.full_name, "registration")

    return {"message": "OTP code sent to your email address."}


@router.post("/register/verify")
def register_verify(data: schemas.UserRegisterVerify, db: Session = Depends(get_db)):
    import uuid
    otp_entry = _verify_auth_code(db, data.email, data.otp, "registration")

    # Verify and generate token
    verification_token = str(uuid.uuid4())
    otp_entry.is_verified = True
    otp_entry.verification_token = verification_token
    db.add(otp_entry)
    db.commit()

    return {
        "message": "OTP verified successfully.",
        "verification_token": verification_token
    }


@router.post("/register/complete", response_model=schemas.Token)
def register_complete(data: schemas.UserRegisterComplete, db: Session = Depends(get_db)):
    otp_entry = _registration_proof(db, data.email, data.verification_token)

    # Check if user already exists
    existing_user = crud.get_user_by_email(db, email=data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create the user using full name from verification entry
    is_first_user = db.query(models.User).count() == 0
    user_in = schemas.UserCreate(
        email=data.email,
        full_name=otp_entry.full_name,
        password=data.password
    )
    db.delete(otp_entry)
    user = crud.create_user(db, user=user_in, is_first_admin=is_first_user)

    # Log user in
    access_token = create_access_token(subject=user.id, role=user.role.value, token_version=int(getattr(user, "token_version", 0) or 0))
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register/simple", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register_simple(
    data: schemas.UserRegisterSimple,
    request: Request,
    db: Session = Depends(get_db),
):
    """Register with a verified email and optional counsellor."""
    proof = _registration_proof(db, data.email, data.verification_token)
    if _user_by_phone(db, data.phone):
        raise HTTPException(400, "An account with this mobile number already exists.")
    # GDPR: ambassadors must accept the Ambassador & Privacy policies at signup.
    if not data.policy_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please accept the Ambassador Policy and Privacy Policy to continue.",
        )
    if data.email and crud.get_user_by_email(db, email=data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    if proof is not None:
        db.delete(proof)
    # Capture the same audit evidence the accept-policy gate captures, so a
    # signup acceptance is not a weaker record than an in-app one.
    xff = request.headers.get("x-forwarded-for")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else None)
    ua = request.headers.get("user-agent")
    user = crud.create_simple_ambassador(db, data, ip=ip, user_agent=ua, force_student=True)
    access_token = create_access_token(subject=user.id, role=user.role.value, token_version=int(getattr(user, "token_version", 0) or 0))
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a 6-digit reset code to the account email (if it exists)."""
    user = crud.get_user_by_email(db, email=data.email)
    # Always return the same message — don't reveal whether the email is registered.
    if user:
        _send_auth_code(db, data.email, user.full_name, "password_reset")
    return {"message": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password", response_model=schemas.Token)
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify the reset code and set a new password, then log the user in."""
    from app.core.security import get_password_hash
    otp_entry = _verify_auth_code(db, data.email, data.otp, "password_reset")

    user = crud.get_user_by_email(db, email=data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    user.password_hash = get_password_hash(data.password)
    # Invalidate any sessions issued before this reset (the fresh token below
    # carries the new version, so the user stays logged in on this device).
    user.token_version = int(getattr(user, "token_version", 0) or 0) + 1
    otp_entry.is_verified = True
    db.add_all([user, otp_entry])
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value, token_version=int(getattr(user, "token_version", 0) or 0))
    return {"access_token": access_token, "token_type": "bearer"}


def _normal_phone(value):
    import re
    digits = re.sub(r"[^0-9]", "", value or "")
    if digits.startswith("00880"):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("01"):
        digits = "88" + digits
    return digits


def _user_by_phone(db, phone):
    normalized = _normal_phone(phone)
    if len(normalized) < 7:
        raise HTTPException(400, "Please enter a valid mobile number.")
    matches = [u for u in db.query(models.User).filter(models.User.phone.isnot(None)).all() if _normal_phone(u.phone) == normalized]
    if len(matches) > 1:
        raise HTTPException(400, "Please sign in with email or contact support for this mobile number.")
    return matches[0] if matches else None


@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    identifier = login_data.email.strip()
    user = crud.get_user_by_email(db, email=identifier) if "@" in identifier else _user_by_phone(db, identifier)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email, mobile number or password"
        )
    
    access_token = create_access_token(subject=user.id, role=user.role.value, token_version=int(getattr(user, "token_version", 0) or 0))
    return {"access_token": access_token, "token_type": "bearer"}


def _google_identity(credential):
    from google.oauth2 import id_token
    from google.auth.transport import requests
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(503, "Google sign-in is not configured yet.")
    try:
        claims = id_token.verify_oauth2_token(credential, requests.Request(), settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=10)
    except Exception:
        raise HTTPException(400, "Google could not verify this account. Please try again.")
    if not claims.get("email") or claims.get("email_verified") is not True:
        raise HTTPException(400, "Please use a verified Google email address.")
    return claims


def _google_profile_complete(user):
    return bool(user and user.phone and user.phone_verified_at and user.policy_accepted_at)


@router.post("/google/demo")
def google_demo(data: schemas.GoogleDemoRequest = None, db: Session = Depends(get_db)):
    """Local preview identity; never accepted when test mode is disabled."""
    from datetime import datetime, timedelta
    import uuid
    if not settings.LOCAL_SIGNUP_TEST_MODE:
        raise HTTPException(404, "Not found")
    demo_id = data.demo_id if data and data.demo_id and data.intent != "signup" else uuid.uuid4().hex
    email = f"google.demo.{demo_id}@example.com"
    user = crud.get_user_by_email(db, email=email)
    if user and _google_profile_complete(user):
        return {"needs_profile": False, "access_token": create_access_token(subject=user.id, role=user.role.value, token_version=int(user.token_version or 0)), "token_type":"bearer"}
    proof = models.OTPVerification(email=email, full_name="Nusrat Jahan", otp_code="", purpose="google_registration", is_verified=True, verification_token=str(uuid.uuid4()), expires_at=datetime.utcnow()+timedelta(minutes=10))
    db.add(proof)
    db.commit()
    return {"needs_profile": True, "email": email, "full_name": "Nusrat Jahan", "verification_token": proof.verification_token, "demo_id": demo_id}


@router.post("/google/prepare")
def google_prepare(data: schemas.GooglePrepareRequest, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    import uuid
    identity = _google_identity(data.credential)
    email = identity["email"]
    user = crud.get_user_by_email(db, email=email)
    if user and (user.role == models.UserRole.admin or _google_profile_complete(user)):
        if data.intent == "signup":
            raise HTTPException(409, "This Google account is already registered. Sign in or choose a different Google account to sign up.")
        return {"needs_profile": False, "access_token": create_access_token(subject=user.id, role=user.role.value, token_version=int(user.token_version or 0)), "token_type":"bearer"}
    # A short-lived, single-use proof allows profile completion without another email code.
    proof = models.OTPVerification(email=email, full_name=identity.get("name", ""), otp_code="", purpose="google_registration", is_verified=True, verification_token=str(uuid.uuid4()), expires_at=datetime.utcnow()+timedelta(minutes=10))
    db.add(proof)
    db.commit()
    return {"needs_profile": True, "email": email, "full_name": identity.get("name", ""), "verification_token": proof.verification_token}


def _google_proof(db, token):
    from datetime import datetime
    proof = db.query(models.OTPVerification).filter(
        models.OTPVerification.verification_token == token,
        models.OTPVerification.purpose == "google_registration",
        models.OTPVerification.is_verified == True,
        models.OTPVerification.expires_at > datetime.utcnow(),
    ).first()
    if not proof:
        raise HTTPException(400, "Google session expired. Please continue with Google again.")
    return proof


@router.post("/google/phone/send")
def google_phone_send(data: schemas.GooglePhoneSend, db: Session = Depends(get_db)):
    import secrets
    from datetime import datetime, timedelta
    from sqlalchemy import or_
    from app.core.phone_verification import normalize_phone, code_digest, send_phone_code
    proof = _google_proof(db, data.verification_token)
    try:
        phone = normalize_phone(data.phone)
    except ValueError as error:
        raise HTTPException(400, str(error))
    existing = _user_by_phone(db, phone)
    if existing and existing.email != proof.email:
        raise HTTPException(409, "This mobile number is already linked to another account.")
    now = datetime.utcnow()
    recent = db.query(models.GooglePhoneChallenge).filter(
        or_(models.GooglePhoneChallenge.email == proof.email, models.GooglePhoneChallenge.phone == phone),
        models.GooglePhoneChallenge.created_at > now - timedelta(seconds=60),
    ).first()
    if recent:
        raise HTTPException(429, "Please wait 60 seconds before requesting another code.")
    code = "123456" if settings.LOCAL_SIGNUP_TEST_MODE else f"{secrets.randbelow(1000000):06d}"
    if not settings.LOCAL_SIGNUP_TEST_MODE and not send_phone_code(phone, code):
        raise HTTPException(503, "We couldn't send your SMS code. Please try again shortly.")
    # Only the latest challenge for this Google identity remains usable.
    db.query(models.GooglePhoneChallenge).filter(models.GooglePhoneChallenge.email == proof.email).delete()
    db.add(models.GooglePhoneChallenge(proof_token=data.verification_token, email=proof.email, phone=phone,
        code_hash=code_digest(data.verification_token, phone, code), attempts=0,
        created_at=now, expires_at=min(proof.expires_at.replace(tzinfo=None), now+timedelta(minutes=10))))
    db.commit()
    return {"message": "Verification code sent.", "phone": phone}


@router.post("/google/complete", response_model=schemas.Token)
def google_complete(data: schemas.GooglePhoneComplete, request: Request, db: Session = Depends(get_db)):
    import secrets
    from datetime import datetime
    from app.core.phone_verification import code_digest
    proof = _google_proof(db, data.verification_token)
    if not data.policy_accepted:
        raise HTTPException(400, "Please accept the programme terms and privacy policy.")
    challenge = db.get(models.GooglePhoneChallenge, data.verification_token)
    if not challenge or challenge.expires_at <= datetime.utcnow() or challenge.attempts >= 5:
        raise HTTPException(400, "Invalid or expired SMS code. Please request a new code.")
    if not secrets.compare_digest(challenge.code_hash, code_digest(data.verification_token, challenge.phone, data.otp)):
        challenge.attempts += 1
        db.commit()
        raise HTTPException(400, "Invalid or expired SMS code. Please try again.")
    existing = _user_by_phone(db, challenge.phone)
    if existing and existing.email != proof.email:
        raise HTTPException(409, "This mobile number is already linked to another account.")
    user = crud.get_user_by_email(db, email=proof.email)
    if user and (user.role == models.UserRole.admin or _google_profile_complete(user)):
        raise HTTPException(409, "This account is already complete. Please sign in with Google.")
    ip = request.client.host if request.client else None
    # Identity comes exclusively from Google's verified server-side proof.
    name = proof.full_name.strip() or proof.email.split("@")[0]
    phone = challenge.phone
    db.delete(challenge)
    db.delete(proof)
    if user:
        user.full_name = name
        user.phone = phone
        user.phone_verified_at = datetime.utcnow()
        crud.record_policy_acceptance(db, user, ip=ip, user_agent=request.headers.get("user-agent"))
        db.commit()
    else:
        profile = schemas.UserRegisterSimple(email=proof.email, first_name=name.split()[0], last_name=" ".join(name.split()[1:]),
            phone=phone, password=secrets.token_urlsafe(40), policy_accepted=True)
        user = crud.create_simple_ambassador(db, profile, ip=ip, user_agent=request.headers.get("user-agent"), force_student=True)
        user.phone_verified_at = datetime.utcnow()
        db.commit()
    return {"access_token": create_access_token(subject=user.id, role=user.role.value, token_version=int(user.token_version or 0)), "token_type": "bearer"}


@router.post("/google", response_model=schemas.Token)
def google_login(login_data: schemas.UserGoogleLogin, db: Session = Depends(get_db)):
    identity = _google_identity(login_data.credential)
    user = crud.get_user_by_email(db, email=identity["email"])
    if not user or (user.role != models.UserRole.admin and not _google_profile_complete(user)):
        raise HTTPException(409, "Please complete your ambassador profile first.")
    return {"access_token": create_access_token(subject=user.id, role=user.role.value, token_version=int(user.token_version or 0)), "token_type": "bearer"}


@router.get("/signup-mode")
def signup_mode():
    return {"test_mode": settings.LOCAL_SIGNUP_TEST_MODE}


@router.get("/counsellors", response_model=list[schemas.CounsellorOption])
def list_counsellors():
    """Public: CRM counsellors an ambassador can attach to (used at signup + in
    settings). Best-effort — returns [] if the CRM is unreachable so the UI can
    still render the 'None of the above' option."""
    from app.integrations.crm_client import fetch_counsellors
    if settings.LOCAL_SIGNUP_TEST_MODE:
        names = ["Abdullah Al Mamun", "Afifa Rahman", "Alif Tasnim", "Arif Hossain", "Azizul Haq Romel", "Farhana Akter", "Fahim Ahmed", "Harunor Rashid", "Jannatul Ferdous", "Mahfuzur Rahman", "Mahnoor Babar", "Md Sahed", "Nabilah Bintay Zaman", "Nusrat Choudhury", "Raisa Islam", "Rida Shoaib", "Sadia Akter", "Shah Habib Swan", "Shah Md Nure Nabi Isfahani Apu", "Syed Fahim Intisar", "Tasnim Jahan"]
        return [{"id": f"dummy-{index + 1}", "name": name} for index, name in enumerate(names)]
    return fetch_counsellors()


def _profile_with_policy(db: Session, user: models.User) -> schemas.UserResponse:
    """UserResponse enriched with the computed accept-terms gate status."""
    resp = schemas.UserResponse.model_validate(user)
    resp.policy = schemas.PolicyStatus(**crud.get_policy_status(db, user))
    return resp


@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _profile_with_policy(db, current_user)


@router.post("/accept-policy", response_model=schemas.UserResponse)
def accept_policy(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record the ambassador's acceptance of the CURRENT Rewards T&C + Privacy
    Policy (both, in one action). The server chooses the versions and captures
    IP/user-agent for audit; the client cannot forge a version. Returns the
    refreshed profile so the frontend can clear the gate."""
    xff = request.headers.get("x-forwarded-for")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else None)
    ua = request.headers.get("user-agent")
    crud.record_policy_acceptance(db, current_user, ip=ip, user_agent=ua)
    return _profile_with_policy(db, current_user)


@router.put("/settings", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.update_user_profile(db, user_id=current_user.id, user_update=user_update)

