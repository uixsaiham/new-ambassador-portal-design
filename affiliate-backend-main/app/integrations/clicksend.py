"""ClickSend (SMS marketing) sync - keep ambassadors' phone numbers in a ClickSend
contact list so the marketing team can run SMS campaigns from the ClickSend dashboard.

Mirrors the MailerLite integration: best-effort and idempotent, NEVER raises - the
marketing sync must never block or break signup. On signup (and phone change) an
ambassador is upserted into the configured contact list; a one-time backfill pushes
the existing ambassadors (triggered once from startup, see app/main.py).

Auth: HTTP Basic (CLICKSEND_USERNAME + CLICKSEND_API_KEY). Phone numbers are
normalised to E.164 (+44...) which ClickSend requires.

Config: CLICKSEND_USERNAME, CLICKSEND_API_KEY, and optionally
CLICKSEND_AMBASSADOR_LIST_ID. If the list id is not set, the list named below is
created on first use and its id is remembered in the app_settings table.
"""
import logging
import re

import httpx
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger(__name__)

_API_BASE = "https://rest.clicksend.com/v3"
_LIST_NAME_DEFAULT = "BHE Ambassadors - Live"
_TIMEOUT = 15.0


def _list_name() -> str:
    return (settings.CLICKSEND_LIST_NAME or "").strip() or _LIST_NAME_DEFAULT


# ---- small key/value settings helpers (app_settings table created in main.py) ----
def _settings_get(key: str):
    try:
        with engine.connect() as conn:
            row = conn.execute(text("SELECT value FROM app_settings WHERE key=:k"), {"k": key}).fetchone()
            return row[0] if row else None
    except Exception:
        return None


def _settings_set(key: str, value: str):
    try:
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO app_settings(key, value) VALUES(:k, :v) "
                     "ON CONFLICT(key) DO UPDATE SET value=:v"),
                {"k": key, "v": value},
            )
    except Exception as e:
        logger.warning("[clicksend] settings_set(%s) failed: %s", key, e)


def _creds():
    user = (settings.CLICKSEND_USERNAME or "").strip()
    key = (settings.CLICKSEND_API_KEY or "").strip()
    return (user, key) if (user and key) else None


def _enabled() -> bool:
    """Configured enough to talk to ClickSend (credentials present). The target list
    id is resolved/created lazily by ensure_list()."""
    return _creds() is not None


# ---- phone + name helpers ----
def normalize_uk_phone(raw) -> str | None:
    """Normalise a stored phone to E.164 (ClickSend requires it). Assumes UK (+44)
    for national formats, since the programme is UK-only. Returns None if it can't
    be made into a plausible E.164 number."""
    if not raw:
        return None
    s = re.sub(r"[^\d+]", "", str(raw))  # keep digits and a leading +
    if not s:
        return None
    if s.startswith("+"):
        digits = s[1:]
    elif s.startswith("00"):          # 0044... international prefix
        digits = s[2:]
    elif s.startswith("0"):           # 07... UK national -> 447...
        digits = "44" + s[1:]
    elif s.startswith("44"):          # already 44...
        digits = s
    else:                              # bare national (e.g. 7757...) -> assume UK
        digits = "44" + s
    digits = re.sub(r"\D", "", digits)
    if not (10 <= len(digits) <= 15):  # E.164 is max 15 digits
        return None
    return "+" + digits


def _split_name(full_name):
    if not full_name:
        return (None, None)
    parts = str(full_name).strip().split()
    if not parts:
        return (None, None)
    if len(parts) == 1:
        return (parts[0], None)
    return (parts[0], " ".join(parts[1:]))


def _tier_value(tier):
    if tier is None:
        return None
    return getattr(tier, "value", None) or str(tier)


# ---- list resolution / creation ----
def ensure_list() -> str | None:
    """Return the target contact list id. Prefer the configured env id; otherwise
    fall back to one we created earlier; otherwise create '{_LIST_NAME}' and remember
    its id. Returns None if not configured or the API call fails."""
    env_id = (settings.CLICKSEND_AMBASSADOR_LIST_ID or "").strip()
    if env_id:
        return env_id
    stored = _settings_get("clicksend_list_id")
    if stored:
        return stored
    creds = _creds()
    if not creds:
        return None
    try:
        resp = httpx.post(
            f"{_API_BASE}/lists",
            json={"list_name": _list_name()},
            auth=creds,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=_TIMEOUT,
        )
    except Exception as e:
        logger.warning("[clicksend] create-list transport error: %s", e)
        return None
    if resp.status_code in (200, 201):
        try:
            new_id = str(resp.json()["data"]["list_id"])
        except Exception:
            logger.warning("[clicksend] create-list: unexpected response %s", resp.text[:300])
            return None
        _settings_set("clicksend_list_id", new_id)
        logger.info("[clicksend] created contact list %r id=%s", _list_name(), new_id)
        return new_id
    logger.warning("[clicksend] create-list failed HTTP %s: %s", resp.status_code, resp.text[:300])
    return None


# ---- the core upsert ----
def add_ambassador_contact(phone, full_name=None, email=None, referral_code=None, tier=None) -> bool:
    """Upsert one ambassador into the ClickSend contact list (phone + name + email +
    referral_code/tier as custom fields). Returns True on success, else False. Never
    raises."""
    if not _enabled():
        logger.info("[clicksend] skipped - not configured")
        return False
    e164 = normalize_uk_phone(phone)
    if not e164:
        logger.info("[clicksend] skipped - no valid phone (%r)", phone)
        return False
    list_id = ensure_list()
    if not list_id:
        logger.info("[clicksend] skipped - no target list")
        return False

    first, last = _split_name(full_name)
    payload = {"phone_number": e164}
    if first:
        payload["first_name"] = first
    if last:
        payload["last_name"] = last
    if email:
        payload["email"] = email
    # custom_1 is flagged required by the ClickSend docs; always send something.
    payload["custom_1"] = (referral_code or "ambassador")
    tv = _tier_value(tier)
    if tv:
        payload["custom_2"] = tv

    try:
        resp = httpx.post(
            f"{_API_BASE}/lists/{list_id}/contacts",
            json=payload,
            auth=_creds(),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=_TIMEOUT,
        )
    except Exception as e:  # network/timeout - non-fatal
        logger.warning("[clicksend] transport error for %s: %s", e164, e)
        return False

    if resp.status_code in (200, 201):
        logger.info("[clicksend] synced %s to list %s", e164, list_id)
        return True
    logger.warning("[clicksend] add failed %s HTTP %s: %s", e164, resp.status_code, resp.text[:300])
    return False


# ---- one-time backfill of existing ambassadors ----
def backfill_all(db) -> dict:
    """Push every student (ambassador) with a valid phone into the list, de-duping by
    normalised number in-code (handles the duplicate numbers without relying on a
    remote cleanup). Returns a summary dict. Best-effort; never raises."""
    import time
    from app.models import User, UserRole

    summary = {"total": 0, "synced": 0, "skipped_no_phone": 0, "skipped_duplicate": 0, "failed": 0}
    if not _enabled():
        logger.info("[clicksend] backfill skipped - not configured")
        return summary
    if not ensure_list():
        logger.info("[clicksend] backfill skipped - no target list")
        return summary

    seen = set()
    try:
        users = db.query(User).filter(User.role == UserRole.student).all()
    except Exception as e:
        logger.warning("[clicksend] backfill query failed: %s", e)
        return summary

    for u in users:
        summary["total"] += 1
        e164 = normalize_uk_phone(getattr(u, "phone", None))
        if not e164:
            summary["skipped_no_phone"] += 1
            continue
        if e164 in seen:
            summary["skipped_duplicate"] += 1
            continue
        seen.add(e164)
        ok = add_ambassador_contact(
            u.phone,
            full_name=getattr(u, "full_name", None),
            email=getattr(u, "email", None),
            referral_code=getattr(u, "referral_code", None),
            tier=getattr(u, "tier", None),
        )
        summary["synced" if ok else "failed"] += 1
        time.sleep(0.15)  # gentle pacing so we stay under ClickSend rate limits

    logger.info("[clicksend] backfill summary: %s", summary)
    # Persist the summary so it's readable without relying on (buffered) stdout logs -
    # e.g. to confirm the prod backfill of all ambassadors after deploy.
    try:
        import json as _json
        _settings_set("clicksend_backfill_summary", _json.dumps(summary))
    except Exception:
        pass
    return summary
