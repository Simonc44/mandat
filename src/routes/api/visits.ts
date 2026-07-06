// /api/visits — compteur de visiteurs persistant (Turso)
// GET  → { count }
// POST → incrémente (1 fois par visiteur via cookie httpOnly 30j) puis { count }

import { createFileRoute } from "@tanstack/react-router";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

async function readCount(): Promise<number> {
  const { tursoClient, ensureSchema } = await import("@/lib/turso.server");
  await ensureSchema();
  const r = await tursoClient().execute(
    "SELECT count FROM visits WHERE id = 1",
  );
  return Number(r.rows[0]?.count ?? 0);
}

export const Route = createFileRoute("/api/visits")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const count = await readCount();
          return new Response(JSON.stringify({ count }), {
            status: 200,
            headers: HEADERS,
          });
        } catch (e) {
          console.error("[API/visits] GET Error:", e);
          return new Response(
            JSON.stringify({ count: 0, error: "Internal Server Error" }),
            {
              status: 500,
              headers: HEADERS,
            },
          );
        }
      },

      POST: async () => {
        try {
          const { tursoClient, ensureSchema } =
            await import("@/lib/turso.server");
          await ensureSchema();
          const c = tursoClient();
          const already = getCookie("mandat_v");
          if (!already) {
            await c.execute(
              "UPDATE visits SET count = count + 1, updated_at = datetime('now') WHERE id = 1",
            );
            setCookie("mandat_v", "1", {
              httpOnly: true,
              sameSite: "lax",
              secure: true,
              maxAge: 60 * 60 * 24 * 30,
              path: "/",
            });
          }
          const r = await c.execute("SELECT count FROM visits WHERE id = 1");
          const count = Number(r.rows[0]?.count ?? 0);
          return new Response(JSON.stringify({ count }), {
            status: 200,
            headers: HEADERS,
          });
        } catch (e) {
          console.error("[API/visits] POST Error:", e);
          return new Response(
            JSON.stringify({ count: 0, error: "Internal Server Error" }),
            {
              status: 500,
              headers: HEADERS,
            },
          );
        }
      },
    },
  },
});
