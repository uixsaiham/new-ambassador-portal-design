"""Preserve existing user records while allowing accounts without email."""
import re
from sqlalchemy import inspect, text


def ensure_optional_email(engine):
    with engine.connect() as conn:
        email = next(c for c in inspect(conn).get_columns("users") if c["name"] == "email")
        if email["nullable"]:
            return
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))
        return
    if engine.dialect.name != "sqlite":
        raise RuntimeError("Apply a migration making users.email nullable before enabling mobile signup")

    # SQLite cannot drop NOT NULL in place. Rebuild from the installed schema so
    # legacy columns, constraints, indexes and triggers are retained verbatim.
    raw = engine.raw_connection()
    foreign_keys = 0
    try:
        cursor = raw.cursor()
        foreign_keys = cursor.execute("PRAGMA foreign_keys").fetchone()[0]
        cursor.execute("PRAGMA foreign_keys=OFF")
        cursor.execute("BEGIN IMMEDIATE")
        ddl = cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").fetchone()[0]
        ddl, count = re.subn(r'(?i)(["`\[]?email["`\]]?\s+[^,\n]+?)\s+NOT NULL', r'\1', ddl, count=1)
        if count != 1:
            raise RuntimeError("Unable to identify users.email NOT NULL constraint")
        ddl = re.sub(r'(?i)^(CREATE TABLE\s+)(?:"users"|`users`|\[users\]|users)', r'\1"_users_optional_email"', ddl, count=1)
        objects = cursor.execute("SELECT sql FROM sqlite_master WHERE tbl_name='users' AND type IN ('index','trigger') AND sql IS NOT NULL").fetchall()
        columns = [row[1] for row in cursor.execute('PRAGMA table_info("users")').fetchall()]
        names = ", ".join('"' + name.replace('"', '""') + '"' for name in columns)
        cursor.execute(ddl)
        cursor.execute(f'INSERT INTO "_users_optional_email" ({names}) SELECT {names} FROM "users"')
        cursor.execute('DROP TABLE "users"')
        cursor.execute('ALTER TABLE "_users_optional_email" RENAME TO "users"')
        for (sql,) in objects:
            cursor.execute(sql)
        if cursor.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError("Foreign key check failed while making email optional")
        raw.commit()
    except Exception:
        raw.rollback()
        raise
    finally:
        raw.execute(f"PRAGMA foreign_keys={int(foreign_keys)}")
        raw.close()
