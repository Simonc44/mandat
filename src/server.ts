import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: unknown,
  ) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getSecurityHeaders(nonce: string): Record<string, string> {
  const scriptSrc = `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://cdn.gpteng.co https://www.googletagmanager.com https://accounts.google.com/gsi/client`;
  const styleSrc = `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://vercel.live https://accounts.google.com/gsi/style`;

  return {
    "Content-Security-Policy":
      `default-src 'none'; ${scriptSrc}; ${styleSrc}; font-src 'self' data: https://fonts.gstatic.com https://cdn.gpteng.co https://vercel.live https://fonts.googleapis.com; img-src 'self' data: blob: https://www2.assemblee-nationale.fr https://www.nosdeputes.fr https://cdn.gpteng.co https://vercel.com https://lh3.googleusercontent.com; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://cdn.gpteng.co https://ai.gateway.lovable.dev https://fonts.googleapis.com https://fonts.gstatic.com https://vercel.com https://api.unkey.dev https://api.unkey.com https://*.google-analytics.com https://accounts.google.com; manifest-src 'self' https://vercel.com; frame-src 'self' https://vercel.live https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

function applySecurityHeaders(response: Response, nonce: string): Response {
  const headers = new Headers(response.headers);
  const securityHeaders = getSecurityHeaders(nonce);
  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (
    !body.includes('"unhandled":true') ||
    !body.includes('"message":"HTTPError"')
  ) {
    return response;
  }

  console.error(
    consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`),
  );
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const nonce = generateNonce();
    // Inject the nonce into request headers so downstream Vinxi/middleware can extract it.
    const headers = new Headers(request.headers);
    headers.set("x-csp-nonce", nonce);

    // We construct a new Request from the request.url string to avoid undici bugs when cloning Request objects.
    // To avoid duplicating bodies or failing on GET, only specify body if method is not GET/HEAD.
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // @ts-ignore
      duplex: hasBody && request.body ? "half" : undefined,
    });

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(modifiedRequest, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized, nonce);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        nonce,
      );
    }
  },
};
