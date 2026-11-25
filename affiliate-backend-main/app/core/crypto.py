"""Application-layer encryption for sensitive fields (bank details) at rest.

Fernet (AES-128-CBC + HMAC). Key comes from settings.BANK_ENC_KEY. Reads gracefully
fall back to legacy plaintext JSON so pre-encryption rows keep working until migrated.
If the key is unset, storage stays plaintext (dev only)."""
import json
from sqlalchemy.types import TypeDecorator, Text
from app.core.config import settings

try:
    from cryptography.fernet import Fernet
    _fernet = Fernet(settings.BANK_ENC_KEY.encode()) if getattr(settings, "BANK_ENC_KEY", "") else None
except Exception:
    _fernet = None


class EncryptedJSON(TypeDecorator):
    """Transparently Fernet-encrypt a JSON-serialisable value at rest, with a
    legacy-plaintext read fallback so pre-encryption rows still decode."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        raw = json.dumps(value)
        return _fernet.encrypt(raw.encode()).decode() if _fernet is not None else raw

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if _fernet is not None:
            try:
                return json.loads(_fernet.decrypt(value.encode()).decode())
            except Exception:
                pass  # not encrypted (legacy plaintext) -> fall through
        try:
            return json.loads(value)
        except Exception:
            return None



def mask_bank(bd):
    """Return a display-masked copy of bank details (account/sort/iban partly hidden,
    holder name kept). Non-dict / empty passes through unchanged."""
    if not isinstance(bd, dict) or not bd:
        return bd
    def _m(v, keep):
        t = str(v)
        return ("\u2022" * max(0, len(t) - keep)) + t[-keep:] if len(t) > keep else "\u2022" * len(t)
    out = dict(bd)
    for k, keep in (("account_number", 4), ("iban", 4), ("sort_code", 2)):
        if out.get(k):
            out[k] = _m(out[k], keep)
    if isinstance(out.get("payout_accounts"), list):
        out["payout_accounts"] = [{**account, "details": mask_bank(account.get("details"))} for account in out["payout_accounts"]]
    return out
