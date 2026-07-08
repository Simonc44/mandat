// MarkdownRenderer.tsx
// Rendu Markdown léger pour les réponses de l'IA — sans dépendance externe
// Supporte : titres #/##/###, **gras**, *italique*, `code`, tableaux, listes, ---, blocs code

import type React from "react";

/** Transforme le Markdown inline en JSX : **gras**, *italique*, `code` */
function renderInline(text: string, baseKey = 0): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = baseKey;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded-md text-[0.78em] font-mono"
          style={{
            background: "oklch(0.88 0.06 285 / 45%)",
            color: "oklch(0.38 0.16 285)",
          }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={key++} className="italic opacity-90">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Parse un bloc tableau Markdown → JSX */
function parseTable(lines: string[]): React.ReactNode {
  const rows = lines
    .filter((l) => l.trim().startsWith("|"))
    .filter((l) => !/^\|[-:\s|]+$/.test(l.trim())); // exclure séparateur

  if (rows.length < 1) return null;

  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  const [header, ...body] = rows;
  const headers = parseRow(header);

  return (
    <div
      className="overflow-x-auto my-3 rounded-xl"
      style={{ border: "1px solid oklch(0.86 0.06 285 / 45%)" }}
    >
      <table className="w-full text-xs border-collapse min-w-[320px]">
        <thead>
          <tr style={{ background: "oklch(0.92 0.06 285 / 35%)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold border-b whitespace-nowrap"
                style={{
                  borderColor: "oklch(0.86 0.06 285 / 35%)",
                  color: "oklch(0.30 0.08 285)",
                }}
              >
                {renderInline(h, i * 100)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background:
                  ri % 2 === 0
                    ? "transparent"
                    : "oklch(0.96 0.02 285 / 25%)",
              }}
            >
              {parseRow(row).map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 border-b"
                  style={{
                    borderColor: "oklch(0.90 0.04 285 / 25%)",
                    color: "oklch(0.30 0.05 285)",
                  }}
                >
                  {renderInline(cell, ri * 1000 + ci * 100)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Composant principal */
export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Ligne vide
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Séparateur ---
    if (/^---+$/.test(line.trim())) {
      elements.push(
        <hr
          key={key++}
          className="my-3"
          style={{ borderColor: "oklch(0.86 0.06 285 / 35%)" }}
        />,
      );
      i++;
      continue;
    }

    // Tableau
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<div key={key++}>{parseTable(tableLines)}</div>);
      continue;
    }

    // Bloc code ```
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // fermeture ```
      elements.push(
        <pre
          key={key++}
          className="my-2 px-3 py-2.5 rounded-xl text-xs overflow-x-auto"
          style={{
            background: "oklch(0.22 0.04 285 / 8%)",
            border: "1px solid oklch(0.82 0.06 285 / 35%)",
            color: "oklch(0.32 0.10 285)",
            fontFamily: "'Menlo', 'Monaco', 'Consolas', monospace",
          }}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Titre ###
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="font-semibold text-[13px] mt-3.5 mb-1.5"
          style={{ color: "oklch(0.30 0.08 285)" }}
        >
          {renderInline(line.slice(4), key * 100)}
        </h3>,
      );
      i++;
      continue;
    }

    // Titre ##
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="font-bold text-[13px] mt-4 mb-2 pb-1"
          style={{
            color: "oklch(0.25 0.10 285)",
            borderBottom: "1px solid oklch(0.86 0.06 285 / 40%)",
          }}
        >
          {renderInline(line.slice(3), key * 100)}
        </h2>,
      );
      i++;
      continue;
    }

    // Titre #
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={key++}
          className="font-bold text-sm mt-4 mb-2"
          style={{ color: "oklch(0.22 0.10 285)" }}
        >
          {renderInline(line.slice(2), key * 100)}
        </h1>,
      );
      i++;
      continue;
    }

    // Liste à puces - ou *
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} className="space-y-1.5 my-2 pl-0.5">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-[13px] leading-relaxed">
              <span
                className="shrink-0 w-1.5 h-1.5 rounded-full"
                style={{
                  background: "oklch(0.58 0.18 285)",
                  marginTop: "0.4rem",
                }}
              />
              <span style={{ color: "oklch(0.28 0.06 285)" }}>
                {renderInline(item, ii * 100 + key * 10)}
              </span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Liste numérotée
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="space-y-1.5 my-2 pl-0.5">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2.5 text-[13px] leading-relaxed">
              <span
                className="shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{
                  background: "oklch(0.88 0.08 285 / 45%)",
                  color: "oklch(0.42 0.18 285)",
                  marginTop: "0.05rem",
                }}
              >
                {ii + 1}
              </span>
              <span style={{ color: "oklch(0.28 0.06 285)" }}>
                {renderInline(item, ii * 100 + key * 10)}
              </span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraphe (accumule les lignes consécutives non-spéciales)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].trim().startsWith("|") &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(
        <p
          key={key++}
          className="text-[13px] leading-relaxed my-1"
          style={{ color: "oklch(0.28 0.05 285)" }}
        >
          {renderInline(paraLines.join(" "), key * 100)}
        </p>,
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}
