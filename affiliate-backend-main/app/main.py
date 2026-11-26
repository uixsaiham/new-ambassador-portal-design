from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, ambassador, admin, integrations, public, policy

import os

def _ensure_user_profile_columns():
    """Add optional ambassador education fields to existing installations."""
    from sqlalchemy import inspect, text
    with engine.begin() as conn:
        columns = {col["name"] for col in inspect(conn).get_columns("users")}
        if "phone_verified_at" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP"))
        for name in ("university", "department_year"):
            if name not in columns:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} VARCHAR(200)"))


def _ensure_payout_columns():
    from sqlalchemy import inspect, text
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            for name in ("bkash", "other"):
                conn.execute(text(f"ALTER TYPE payoutmethod ADD VALUE IF NOT EXISTS '{name}'"))
            for name in ("processing", "failed"):
                conn.execute(text(f"ALTER TYPE payoutstatus ADD VALUE IF NOT EXISTS '{name}'"))
        columns = {col["name"] for col in inspect(conn).get_columns("payouts")}
        for name, dtype in {"status_note": "VARCHAR(500)", "processing_at": "TIMESTAMP", "request_key": "VARCHAR(100)"}.items():
            if name not in columns:
                conn.execute(text(f"ALTER TABLE payouts ADD COLUMN {name} {dtype}"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_payout_request_key ON payouts(request_key)"))


def _ensure_referral_columns():
    """Additive, idempotent micro-migration: create_all() only creates missing
    tables, it never ALTERs an existing one. Add new nullable columns to the
    referrals table if they're absent so a deploy picks them up automatically.
    Safe to run every startup (checks before altering) and no-ops if the DB is
    unreachable."""
    from sqlalchemy import inspect, text
    additive_columns = {
        "application_stage": "VARCHAR(60)",
        "application_status": "VARCHAR(60)",
        "application_notes": "TEXT",
        "application_university": "VARCHAR(200)",
        "application_course": "VARCHAR(200)",
        "application_intake": "VARCHAR(60)",
        "application_campus": "VARCHAR(150)",
        "application_branch": "VARCHAR(150)",
        "crm_counsellor_id": "VARCHAR(64)",
        "crm_counsellor_name": "VARCHAR(191)",
        "referrer_consent": "BOOLEAN NOT NULL DEFAULT 0",
        "lead_consent": "BOOLEAN NOT NULL DEFAULT 0",
        "consent_at": "DATETIME",
        "consent_policy_version": "VARCHAR(20)",
        "crm_lead_status": "VARCHAR(60)",
        "status_reason": "VARCHAR(500)",
        "enrolment_reward_denied": "BOOLEAN NOT NULL DEFAULT 0",
        # Idempotency latch for the enrolment notifications (admin + ambassador email).
        # Backfills to 0 on existing rows; NOT NULL DEFAULT is a fast, non-rewriting
        # ADD COLUMN in SQLite.
        "enrolment_email_sent": "BOOLEAN NOT NULL DEFAULT 0",
        # Two-installment enrolment reward + enrolment-date anchor for the estimated
        # installment windows shown on the ambassador dashboard.
        "enrolled_at": "DATETIME",
        "enrolment_installment_1_paid": "BOOLEAN NOT NULL DEFAULT 0",
        "enrolment_installment_1_paid_at": "DATETIME",
        "enrolment_installment_2_paid": "BOOLEAN NOT NULL DEFAULT 0",
        "enrolment_installment_2_paid_at": "DATETIME",
    }
    try:
        existing = {c["name"] for c in inspect(engine).get_columns("referrals")}
        with engine.begin() as conn:
            for name, ddl in additive_columns.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE referrals ADD COLUMN {name} {ddl}"))
                    print(f"[migration] added referrals.{name}")
            # One-time backfill (idempotent, guarded by the flags/NULLs):
            # (1) any enrolment reward already paid in full becomes "both installments
            # paid" so historical rewards render correctly under the new model;
            # (2) enrolled rows get an enrolled_at anchor from updated_at (best proxy).
            conn.execute(text(
                "UPDATE referrals SET enrolment_installment_1_paid=1, enrolment_installment_2_paid=1, "
                "enrolment_installment_1_paid_at=COALESCE(enrolment_installment_1_paid_at, updated_at), "
                "enrolment_installment_2_paid_at=COALESCE(enrolment_installment_2_paid_at, updated_at) "
                "WHERE enrolment_reward_paid=1 AND enrolment_installment_1_paid=0"
            ))
            conn.execute(text(
                "UPDATE referrals SET enrolled_at=updated_at WHERE enrolled_at IS NULL AND ("
                "enrolment_reward_paid=1 OR status IN ('enrolled_home','enrolled_international') "
                "OR lower(COALESCE(application_stage,'') || COALESCE(application_status,'')) LIKE '%enrol%')"
            ))
    except Exception as e:
        print(f"[migration] ensure referral columns skipped: {e}")


def _ensure_otp_columns():
    """Old codes have unknown purpose and cannot authorize either new flow."""
    from sqlalchemy import inspect, text
    existing = {c["name"] for c in inspect(engine).get_columns("otp_verifications")}
    with engine.begin() as conn:
        for name, ddl in {
            "purpose": "VARCHAR(20) NOT NULL DEFAULT 'legacy'",
            "attempts": "INTEGER NOT NULL DEFAULT 0",
        }.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE otp_verifications ADD COLUMN {name} {ddl}"))


def _ensure_policy_documents():
    """Seed the immutable legal-document archive for the CURRENT versions if missing.
    Idempotent (unique on document+version); reads the frozen HTML from app/policy_seed.
    Runs on startup so a fresh deploy publishes the current versions automatically."""
    from app.core.database import SessionLocal
    from app.models import PolicyDocument
    from app import policy_seed
    versions = {
        "rewards_terms": settings.REWARDS_TERMS_VERSION,
        "privacy_policy": settings.PRIVACY_POLICY_VERSION,
    }
    db = SessionLocal()
    try:
        for doc, ver in versions.items():
            if db.query(PolicyDocument).filter_by(document=doc, version=ver).first():
                continue
            seed = policy_seed.load_seed(doc, ver)
            if not seed:
                continue
            db.add(PolicyDocument(
                document=doc, version=ver, title=seed["title"],
                effective_date=seed["effective_date"], body_html=seed["body_html"],
                content_sha256=seed["sha256"],
            ))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[migration] ensure policy documents skipped: {e}")
    finally:
        db.close()


def _ensure_app_settings():
    """Tiny key/value table used for app-level markers (e.g. the ClickSend one-time
    backfill guard). Idempotent."""
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            conn.execute(text(
                "CREATE TABLE IF NOT EXISTS app_settings ("
                "key VARCHAR(100) PRIMARY KEY, value TEXT)"
            ))
    except Exception as e:
        print(f"[migration] ensure app_settings skipped: {e}")


def _maybe_clicksend_backfill():
    """One-time backfill of existing ambassadors into the ClickSend contact list.
    Gated behind CLICKSEND_BACKFILL_ON_BOOT and an atomically-claimed app_settings
    marker so it runs exactly once (even across workers) and never on a plain restart.
    Runs in a daemon thread so it never delays startup."""
    flag = (settings.CLICKSEND_BACKFILL_ON_BOOT or "").strip().lower() in ("1", "true", "yes")
    if not flag:
        return
    try:
        from app.integrations.clicksend import _enabled
        if not _enabled():
            print("[clicksend] backfill flag set but not configured - skipping")
            return
        from sqlalchemy import text
        import datetime
        stamp = datetime.datetime.utcnow().isoformat()
        with engine.begin() as conn:
            res = conn.execute(
                text("INSERT INTO app_settings(key, value) VALUES('clicksend_backfilled_at', :v) "
                     "ON CONFLICT(key) DO NOTHING"),
                {"v": stamp},
            )
        if getattr(res, "rowcount", 0) != 1:
            print("[clicksend] backfill already done - skipping")
            return
    except Exception as e:
        print(f"[clicksend] backfill precheck skipped: {e}")
        return

    import threading

    def _run():
        from app.core.database import SessionLocal
        from app.integrations.clicksend import backfill_all
        db = SessionLocal()
        try:
            summary = backfill_all(db)
            print(f"[clicksend] backfill complete: {summary}", flush=True)
        except Exception as e:
            print(f"[clicksend] backfill error: {e}")
        finally:
            db.close()

    threading.Thread(target=_run, daemon=True).start()
    print("[clicksend] backfill started in background", flush=True)


# Auto-create tables on startup (skip during testing or if DB connection fails)
if "pytest" not in os.environ.get("PYTEST_CURRENT_TEST", ""):
    try:
        Base.metadata.create_all(bind=engine)
        _ensure_user_profile_columns()
        from app.core.optional_email import ensure_optional_email
        ensure_optional_email(engine)
        _ensure_payout_columns()
        _ensure_referral_columns()
        _ensure_otp_columns()
        _ensure_policy_documents()
        _ensure_app_settings()
        if settings.LOCAL_SIGNUP_TEST_MODE:
            from app.core.database import SessionLocal
            from app.models import User
            from app.demo_data import seed_demo_for_user
            with SessionLocal() as demo_db:
                for demo_user in demo_db.query(User).all():
                    seed_demo_for_user(demo_db, demo_user)
        _maybe_clicksend_backfill()
    except Exception as e:
        print(f"Database connection not available at startup, skipping table auto-creation: {e}")

# Interactive API docs are OFF by default (prod). They switch ON when
# ENABLE_DOCS=true (set on the test env), so the mobile team gets Swagger at
# /docs + the OpenAPI spec at /openapi.json without exposing them on prod.
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
)

# --- Rate limiting (in-memory, per client IP) on sensitive auth endpoints ---
# Self-contained brute-force throttle; no external dependency. Keyed on the real
# client IP (X-Forwarded-For, since the API runs behind nginx). One uvicorn process,
# so an in-memory store suffices. Limits sit well above normal human usage.
import time as _rl_time
from collections import defaultdict as _rl_defaultdict
from fastapi import Request as _RLRequest
from fastapi.responses import JSONResponse as _RLJSONResponse

_RL_BUCKETS = _rl_defaultdict(list)
_RL_RULES = {
    "/auth/register": (15, 600),
    "/auth/login": (30, 300),
    "/auth/google": (30, 300),
    "/auth/google/prepare": (30, 300),
    "/auth/google/phone/send": (10, 300),
    "/auth/google/complete": (30, 300),
    "/auth/register/initiate": (10, 600),
    "/auth/register/verify": (20, 600),
    "/auth/register/complete": (20, 600),
    "/auth/register/simple": (15, 600),
    "/auth/forgot-password": (10, 600),
    "/auth/reset-password": (20, 600),
}


@app.middleware("http")
async def _rate_limit_mw(request: _RLRequest, call_next):
    rule = _RL_RULES.get(request.url.path)
    if rule and request.method == "POST":
        limit, window = rule
        xff = request.headers.get("x-forwarded-for")
        ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
        key = ip + "|" + request.url.path
        now = _rl_time.time()
        cutoff = now - window
        keep = [t for t in _RL_BUCKETS[key] if t >= cutoff]
        if len(keep) >= limit:
            _RL_BUCKETS[key] = keep
            return _RLJSONResponse(status_code=429,
                content={"detail": "Too many attempts. Please wait a bit and try again."},
                headers={"Retry-After": str(window)})
        keep.append(now)
        _RL_BUCKETS[key] = keep
    return await call_next(request)

# CORS Policy configuration
# Locked to the known frontend origins (env-overridable via CORS_ORIGINS). The old
# wildcard "*" + allow_credentials=True is an invalid/insecure combo; browsers are
# now only allowed to call the API from the ambassador portal (and local dev).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(ambassador.router)
app.include_router(admin.router)
app.include_router(integrations.router)
app.include_router(public.router)
app.include_router(policy.router)

from fastapi.staticfiles import StaticFiles
import os

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "BHE Uni Ambassador & Rewards Programme API is running.",
        "documentation": "/docs"
    }
