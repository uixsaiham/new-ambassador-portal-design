import pytest
from app.core import phone_verification as phone


@pytest.mark.parametrize("raw,expected", [("01712345678","+8801712345678"),("+880 1712 345678","+8801712345678"),("008801712345678","+8801712345678"),("+44 7700 900123","+447700900123")])
def test_phone_formats(raw, expected):
    assert phone.normalize_phone(raw) == expected


@pytest.mark.parametrize("raw", ["abc","017","+00000000","+880abc1712345678", "++8801712345678"])
def test_invalid_phone(raw):
    with pytest.raises(ValueError):
        phone.normalize_phone(raw)


def test_sms_checks_message_status_and_fails_closed(monkeypatch):
    monkeypatch.setattr(phone.settings,"CLICKSEND_USERNAME", "test")
    monkeypatch.setattr(phone.settings,"CLICKSEND_API_KEY", "test")
    class Response:
        is_success = True
        def json(self):
            return {"response_code":"SUCCESS", "data":{"messages":[{"status":"SUCCESS"}]}}
    calls=[]
    def send(*args, **kwargs):
        calls.append(kwargs)
        return Response()
    monkeypatch.setattr(phone.httpx,"post",send)
    assert phone.send_phone_code("+8801712345678","123456")
    assert calls[0]["json"]["messages"][0]["to"] == "+8801712345678"
    monkeypatch.setattr(Response,"json",lambda self:{"response_code":"SUCCESS","data":{"messages":[{"status":"INSUFFICIENT_CREDIT"}]}})
    assert not phone.send_phone_code("+8801712345678","123456")
    monkeypatch.setattr(phone.settings,"CLICKSEND_API_KEY", "")
    calls.clear()
    assert not phone.send_phone_code("+8801712345678","123456")
    assert not calls
