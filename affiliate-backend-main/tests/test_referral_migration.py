from sqlalchemy import create_engine, inspect, text

from app import main


def test_legacy_referral_migration_is_idempotent(monkeypatch):
    engine = create_engine("sqlite://")
    monkeypatch.setattr(main, "engine", engine)
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE referrals (id TEXT PRIMARY KEY, "
                          "updated_at DATETIME, enrolment_reward_paid BOOLEAN, status TEXT)"))
        conn.execute(text("INSERT INTO referrals VALUES "
                          "('legacy', '2026-01-01', 1, 'enrolled_home')"))

    main._ensure_referral_columns()
    main._ensure_referral_columns()

    columns = {column['name'] for column in inspect(engine).get_columns('referrals')}
    assert {'application_stage', 'application_status', 'application_notes',
            'application_university', 'application_course', 'application_intake',
            'application_campus', 'application_branch', 'crm_counsellor_id',
            'crm_counsellor_name', 'consent_at', 'consent_policy_version'} <= columns
    with engine.connect() as conn:
        rows = conn.execute(text('SELECT * FROM referrals')).mappings().all()
    assert len(rows) == 1
    row = rows[0]
    assert row['id'] == 'legacy'
    assert row['enrolment_reward_denied'] == 0
    assert row['referrer_consent'] == row['lead_consent'] == 0
    assert row['enrolment_installment_1_paid'] == row['enrolment_installment_2_paid'] == 1
    assert row['enrolled_at'] == '2026-01-01'
