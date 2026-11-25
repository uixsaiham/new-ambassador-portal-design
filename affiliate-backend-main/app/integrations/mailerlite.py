"""MailerLite (marketing) sync — add ambassadors to a MailerLite group.

On signup an ambassador is added as an active subscriber to the configured group
so the marketing team can run campaigns. Best-effort and idempotent: a re-add of
an existing email just updates their fields/group. Never raises — the marketing
sync must never block or break the signup flow.

Uses the current MailerLite API (connect.mailerlite.com), Bearer JWT token.
"""
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

_API_BASE = "https://connect.mailerlite.com/api"


def add_ambassador(email: str, name: str = None, referral_code: str = None) -> bool:
    """Upsert one ambassador into the MailerLite ambassador group as an active
    subscriber (email + name + referral_code). Returns True on success, else False.
    Never raises."""
    token = (settings.MAILERLITE_API_TOKEN or "").strip()
    group_id = (settings.MAILERLITE_AMBASSADOR_GROUP_ID or "").strip()
    if not token or not group_id:
        logger.info("[mailerlite] skipped — not configured")
        return False
    if not email:
        return False

    fields = {}
    if name:
        fields["name"] = name
    if referral_code:
        fields["referral_code"] = referral_code

    payload = {"email": email, "groups": [group_id], "status": "active"}
    if fields:
        payload["fields"] = fields

    try:
        resp = httpx.post(
            f"{_API_BASE}/subscribers",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=15.0,
        )
    except Exception as e:  # network/timeout — non-fatal
        logger.warning("[mailerlite] transport error for %s: %s", email, e)
        return False

    if resp.status_code in (200, 201):
        logger.info("[mailerlite] added %s to group %s", email, group_id)
        return True

    logger.warning("[mailerlite] add failed %s HTTP %s: %s", email, resp.status_code, resp.text[:300])
    return False
