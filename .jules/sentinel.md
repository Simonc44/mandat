## 2026-07-02 - [Incomplete JSON-LD Escaping]
**Vulnerability:** The `safeJsonLd` utility was only escaping the `<` character, which is insufficient for full defense-in-depth against XSS in all browser environments.
**Learning:** Manual injection of JSON-LD via `dangerouslySetInnerHTML` into a `<script>` tag requires comprehensive escaping of `<`, `>`, and `&` to prevent tag breakout, even when using `JSON.stringify`.
**Prevention:** Ensure all characters that can be used to manipulate HTML tags are escaped when injecting data into script blocks.
