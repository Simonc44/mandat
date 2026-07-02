// /api/status — vérifie que le site et sa base de données répondent.
// GET → { ok, db, deputes, scrutins, lastUpdated, checkedAt, responseMs }

import { createFileRoute } from "@tanstack/react-router";

const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      GET: async () => {
        const start = Date.now();
        const checkedAt = new Date().toISOString();
        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const c = tursoClient();

          const [deputes, scrutins, meta] = await Promise.all([
            c.execute("SELECT COUNT(*) AS n FROM deputes"),
            c.execute("SELECT COUNT(*) AS n FROM scrutins"),
            c
              .execute({
                sql: "SELECT value FROM meta WHERE key = ?",
                args: ["last_updated"],
              })
              .catch(() => ({ rows: [] as { value?: unknown }[] })),
          ]);

          const nbDeputes = Number(deputes.rows[0]?.n ?? 0);
          const nbScrutins = Number(scrutins.rows[0]?.n ?? 0);
          const lastUpdated = meta.rows[0]?.value
            ? String(meta.rows[0].value)
            : null;

          const ok = nbDeputes > 0 && nbScrutins > 0;

          return new Response(
            JSON.stringify({
              ok,
              db: "up",
              deputes: nbDeputes,
              scrutins: nbScrutins,
              lastUpdated,
              checkedAt,
              responseMs: Date.now() - start,
            }),
            { status: 200, headers: HEADERS },
          );
        } catch (e) {
          return new Response(
            JSON.stringify({
              ok: false,
              db: "down",
              error: (e as Error).message,
              checkedAt,
              responseMs: Date.now() - start,
            }),
            { status: 200, headers: HEADERS },
          );
        }
      },
    },
  },
});
