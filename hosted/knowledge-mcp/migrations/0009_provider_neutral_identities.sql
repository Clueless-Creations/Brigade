-- Migration 0009: provider-neutral identities (ADR-0020 / issue #6).
--
-- Before this migration, console identity was Google-only: `users.google_sub` was NOT NULL
-- UNIQUE and there was no `identities` table (0001_identity_and_tenancy.sql). Email was also a
-- uniqueness key via `users_by_email`, which would force a silent merge (or a unique-constraint
-- failure) if two providers asserted the same address — forbidden by ADR-0020.
--
-- This migration:
--   1. Rebuilds `users` so `google_sub` is nullable (compatibility mirror for Google rows only;
--      non-Google identities must never invent a fake google_sub).
--   2. Replaces the unique email index with a non-unique index (email is profile data).
--   3. Adds `identities(provider, subject, user_id, …)` with UNIQUE/PRIMARY (provider, subject).
--   4. Backfills Google identities from existing `users.google_sub` values.
--
-- Rebuild technique matches 0008_lazy_stripe_customer.sql: D1 enforces FKs unconditionally and
-- does not honour PRAGMA foreign_keys=OFF, so dependents of `users` (memberships → api_keys /
-- sessions) are backed up, the cascade from DROP TABLE users is allowed to run, `users` is
-- recreated, then dependents are restored. `accounts` and billing tables are untouched.
--
-- Remote apply of this migration against production D1 is an explicit hold for #6 (not authorized
-- by the source PR alone). Tests apply it locally via the migration harness.

CREATE TABLE _migration_0009_memberships_backup AS SELECT * FROM memberships;
CREATE TABLE _migration_0009_api_keys_backup AS SELECT * FROM api_keys;
CREATE TABLE _migration_0009_sessions_backup AS SELECT * FROM sessions;
CREATE TABLE _migration_0009_users_backup AS SELECT * FROM users;

-- Cascades into memberships (DELETE), which cascades into api_keys and sessions via their
-- composite FK to memberships — all three backed up above. accounts / billing rows are untouched.
DROP TABLE users;

-- Same shape as 0001, with google_sub nullable. UNIQUE still applies among non-null values;
-- SQLite UNIQUE allows any number of NULLs, which is every non-Google identity.
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL
    CHECK (length(id) BETWEEN 1 AND 80 AND id NOT GLOB '*[^a-zA-Z0-9_-]*'),
  -- Compatibility mirror for Google identities only. New non-Google rows leave this NULL.
  google_sub TEXT UNIQUE
    CHECK (google_sub IS NULL
           OR (length(google_sub) BETWEEN 1 AND 255 AND google_sub NOT GLOB '*[^a-zA-Z0-9_.-]*')),
  email TEXT NOT NULL
    CHECK (length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%.%' AND email NOT GLOB '*[ ,;<>]*'),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  display_name TEXT
    CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 200),
  created_at TEXT NOT NULL CHECK (created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  updated_at TEXT NOT NULL CHECK (updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at)),
  disabled_at TEXT
    CHECK (disabled_at IS NULL OR disabled_at = strftime('%Y-%m-%dT%H:%M:%fZ', disabled_at))
) STRICT;

INSERT INTO users (id, google_sub, email, email_verified, display_name, created_at, updated_at, disabled_at)
  SELECT id, google_sub, email, email_verified, display_name, created_at, updated_at, disabled_at
    FROM _migration_0009_users_backup;

-- Email is profile data, not an account-link key (ADR-0020). Non-unique index keeps lookups.
CREATE INDEX users_by_email ON users (lower(email));

DELETE FROM memberships;
INSERT INTO memberships (account_id, user_id, role, status, created_at, updated_at)
  SELECT account_id, user_id, role, status, created_at, updated_at FROM _migration_0009_memberships_backup;

DELETE FROM api_keys;
INSERT INTO api_keys (id, account_id, user_id, sha256_hex, scopes, key_prefix, label, created_at, revoked_at, expires_at, last_used_at)
  SELECT id, account_id, user_id, sha256_hex, scopes, key_prefix, label, created_at, revoked_at, expires_at, last_used_at
    FROM _migration_0009_api_keys_backup;

DELETE FROM sessions;
INSERT INTO sessions (id, user_id, account_id, created_at, expires_at, revoked_at, last_seen_at)
  SELECT id, user_id, account_id, created_at, expires_at, revoked_at, last_seen_at
    FROM _migration_0009_sessions_backup;

-- Canonical identity: unique (provider, subject). users remains the account/person owner.
CREATE TABLE identities (
  provider TEXT NOT NULL
    CHECK (provider IN ('google', 'github') AND length(provider) BETWEEN 1 AND 32),
  subject TEXT NOT NULL
    CHECK (length(subject) BETWEEN 1 AND 255 AND subject NOT GLOB '*[^a-zA-Z0-9_.-]*'),
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL CHECK (created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  updated_at TEXT NOT NULL CHECK (updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at)),
  PRIMARY KEY (provider, subject)
) STRICT;

CREATE INDEX identities_by_user ON identities (user_id, provider);

-- Backfill Google identities from the compatibility column. Idempotent on re-apply of this
-- INSERT shape against an empty identities table (fresh apply); this migration runs once.
INSERT INTO identities (provider, subject, user_id, created_at, updated_at)
  SELECT 'google', google_sub, id, created_at, updated_at
    FROM users
   WHERE google_sub IS NOT NULL;

DROP TABLE _migration_0009_memberships_backup;
DROP TABLE _migration_0009_api_keys_backup;
DROP TABLE _migration_0009_sessions_backup;
DROP TABLE _migration_0009_users_backup;
