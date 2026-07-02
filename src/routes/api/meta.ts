// /api/meta — lit la table `meta` (key/value) sur Turso.
// GET ?key=last_updated → { key, value }
// GET (sans key) → { items: [{ key, value }] }

import { createFileRoute } from "@tanstack/react-router";

const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=60",
};

async function readMeta(key: string | null) {
  const { tursoClient } = await import("@/lib/turso.server");
  const c = tursoClient();
  if (key) {
    const r = await c.execute({
      sql: "SELECT key, value FROM meta WHERE key = ?",
      args: [key],
    });
    const row = r.rows[0];
    return { key, value: row ? String(row.value ?? "") : null };
  }
  const r = await c.execute("SELECT key, value FROM meta");
  return {
    items: r.rows.map((row) => ({
      key: String(row.key ?? ""),
      value: String(row.value ?? ""),
    })),
  };
}

export const Route = createFileRoute("/api/meta")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const key = url.searchParams.get("key");
          const data = await readMeta(key);
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: HEADERS,
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 500,
            headers: HEADERS,
          });
        }
      },
    },
  },
});
