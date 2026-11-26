"""Transactional phone verification, separate from marketing contact sync."""
import hashlib
import hmac
import re
import httpx
from app.core.config import settings


def normalize_phone(raw):
    value = re.sub(r"[\s()\-]", "", raw or "")
    if value.startswith("00"):
        value = "+" + value[2:]
    elif re.fullmatch(r"01[3-9]\d{8}", value):
        value = "+88" + value
    elif re.fullmatch(r"8801[3-9]\d{8}", value):
        value = "+" + value
    if not re.fullmatch(r"\+[1-9]\d{7,14}", value):
        raise ValueError("Enter a valid mobile number, including country code outside Bangladesh.")
    return value


def code_digest(token, phone, code):
    return hmac.new(settings.SECRET_KEY.encode(), f"{token}:{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def send_phone_code(phone, code):
    if not settings.CLICKSEND_USERNAME or not settings.CLICKSEND_API_KEY:
        return False
    try:
        response = httpx.post(
            "https://rest.clicksend.com/v3/sms/send",
            auth=(settings.CLICKSEND_USERNAME, settings.CLICKSEND_API_KEY),
            json={"messages": [{"source": "bhe-portal", "to": phone, "body": f"Your BHE Uni verification code is {code}. Expires in 10 minutes. Do not share this code."}]},
            timeout=15,
        )
        payload = response.json()
        messages = payload.get("data", {}).get("messages", [])
        return response.is_success and payload.get("response_code") == "SUCCESS" and len(messages) == 1 and messages[0].get("status") == "SUCCESS"
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        return False
