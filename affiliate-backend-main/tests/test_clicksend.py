"""Unit tests for the ClickSend SMS sync integration.

These are pure/offline tests: the phone normaliser is a pure function, and the
upsert must no-op (return False, make NO network call) when the integration is not
configured - which is the case in the test environment (no CLICKSEND_* creds).
"""
from app.integrations import clicksend


def test_normalize_uk_phone_formats():
    cases = {
        "07757408797": "+447757408797",
        "+44 7757 408797": "+447757408797",
        "447757408797": "+447757408797",
        "7757408797": "+447757408797",
        "0044 7757 408797": "+447757408797",
        "(07701) 234567": "+447701234567",
        "07123 456 789": "+447123456789",
    }
    for raw, expected in cases.items():
        assert clicksend.normalize_uk_phone(raw) == expected, raw


def test_normalize_uk_phone_rejects_junk():
    for bad in ["", None, "abc", "12", "   ", "+"]:
        assert clicksend.normalize_uk_phone(bad) is None, bad


def test_normalize_keeps_international_e164():
    assert clicksend.normalize_uk_phone("+1 415 555 2671") == "+14155552671"


def test_split_name():
    assert clicksend._split_name("Jane Doe") == ("Jane", "Doe")
    assert clicksend._split_name("Jane Van Doe") == ("Jane", "Van Doe")
    assert clicksend._split_name("Jane") == ("Jane", None)
    assert clicksend._split_name("") == (None, None)
    assert clicksend._split_name(None) == (None, None)


def test_add_contact_noop_when_unconfigured():
    # No CLICKSEND_* creds in the test env -> must return False without raising
    # and without attempting any HTTP call.
    assert clicksend._enabled() is False
    assert clicksend.add_ambassador_contact("07757408797", full_name="Jane Doe") is False
    # Even with a clearly invalid phone it stays safe.
    assert clicksend.add_ambassador_contact(None) is False
