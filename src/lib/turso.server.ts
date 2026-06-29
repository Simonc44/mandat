// Turso (libsql) client — server-only.
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

export function tursoClient(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  _client = createClient({ url, authToken });
  return _client;
}

export async function ensureSchema(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const c = tursoClient();
    await c.execute(`
      CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await c.execute(`INSERT OR IGNORE INTO visits (id, count) VALUES (1, 0)`);
    // Tables deputes / scrutins créées par scripts/migrate-to-turso.mjs.
    // Pas de CREATE ici pour ne pas allonger le cold-start des routes.
  })().catch((e) => {
    _initPromise = null;
    throw e;
  });
  return _initPromise;
}
