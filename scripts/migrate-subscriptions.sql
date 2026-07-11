-- Migration : table subscriptions
-- À exécuter manuellement une fois dans Turso :
-- turso db shell <votre-db> < scripts/migrate-subscriptions.sql

CREATE TABLE IF NOT EXISTS subscriptions (
  id          TEXT PRIMARY KEY,           -- UUID v4
  email       TEXT NOT NULL,
  depute_slug TEXT NOT NULL,
  depute_nom  TEXT NOT NULL,              -- prénom + nom (cache)
  token       TEXT NOT NULL UNIQUE,       -- token de désabonnement (UUID v4)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  active      INTEGER NOT NULL DEFAULT 1  -- 1 = actif, 0 = désabonné
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_email_slug
  ON subscriptions (email, depute_slug)
  WHERE active = 1;

CREATE INDEX IF NOT EXISTS idx_subscriptions_depute_slug
  ON subscriptions (depute_slug, active);

CREATE INDEX IF NOT EXISTS idx_subscriptions_token
  ON subscriptions (token);
