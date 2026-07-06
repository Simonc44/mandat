## 2026-07-02 - [Incomplete JSON-LD Escaping]

**Vulnerability:** The `safeJsonLd` utility was only escaping the `<` character, which is insufficient for full defense-in-depth against XSS in all browser environments.
**Learning:** Manual injection of JSON-LD via `dangerouslySetInnerHTML` into a `<script>` tag requires comprehensive escaping of `<`, `>`, and `&` to prevent tag breakout, even when using `JSON.stringify`.
**Prevention:** Ensure all characters that can be used to manipulate HTML tags are escaped when injecting data into script blocks.

## 2026-07-03 - [Information Leakage in API Errors]

**Vulnerability:** API routes were returning raw error messages (`(e as Error).message`) to the client, which could leak internal system details, database schemas, or file paths.
**Learning:** Always catch errors at the API boundary and return a generic error message to the client while logging the detailed error on the server for debugging.
**Prevention:** Implement a standard error handling pattern for all server handlers that masks internal details.

## 2026-07-03 - [Package Manager Environment Desync]

**Vulnerability:** Running `pnpm install` in the agent environment caused an unintended downgrade of `lucide-react` in `pnpm-lock.yaml`.
**Learning:** The agent's global or cached `pnpm` version/config might conflict with the project's lockfile, especially when specific versions are pinned in `package.json`.
**Prevention:** Always verify lockfile changes after installation and use `git checkout` to restore unrelated changes if they occur.

## 2026-07-06 - [Overly Permissive CORS on Internal API]

**Vulnerability:** The `/api/visits` endpoint was configured with `Access-Control-Allow-Origin: "*"`, exposing visitor data and counter increment logic to any cross-origin request.
**Learning:** Internal APIs used exclusively by the application's own frontend should not have CORS enabled, as relative fetches already operate on the same origin.
**Prevention:** Default to no CORS for internal endpoints and only enable it with a strict whitelist if external access is explicitly required.
