// /developers — Page documentation API + générateur de clé
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createSeoMeta, SITE_URL } from "./__root";
import {
  Code,
  Key,
  Zap,
  BookOpen,
  Shield,
  Copy,
  Check,
  ChevronRight,
  Terminal,
  Users,
  Vote,
  BarChart3,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: createSeoMeta({
      title: "API Mandat — Documentation pour développeurs",
      description:
        "API REST publique pour accéder aux données de l'Assemblée nationale : députés, scrutins, groupes politiques. Gratuite, open data, mise à jour quotidiennement.",
      canonical: `${SITE_URL}/developers`,
    }),
  }),
  component: DevelopersPage,
});

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      style={{
        background: copied ? "oklch(0.55 0.18 145 / 20%)" : "oklch(0.88 0.05 285 / 40%)",
        color: copied ? "oklch(0.45 0.18 145)" : "oklch(0.50 0.16 285)",
      }}
      aria-label="Copier"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: "oklch(0.14 0.04 285)", border: "1px solid oklch(0.25 0.06 285 / 60%)" }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: "oklch(0.25 0.06 285 / 60%)", background: "oklch(0.18 0.04 285)" }}>
        <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: "oklch(0.65 0.10 285)" }}>{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="px-4 py-4 overflow-x-auto text-xs leading-relaxed font-mono"
        style={{ color: "oklch(0.88 0.05 285)", scrollbarWidth: "thin" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Badge({ children, color = "purple" }: { children: React.ReactNode; color?: "purple" | "green" | "blue" | "amber" }) {
  const styles = {
    purple: { background: "oklch(0.90 0.08 285 / 60%)", color: "oklch(0.42 0.18 285)" },
    green:  { background: "oklch(0.90 0.08 145 / 60%)", color: "oklch(0.40 0.18 145)" },
    blue:   { background: "oklch(0.90 0.08 240 / 60%)", color: "oklch(0.40 0.18 240)" },
    amber:  { background: "oklch(0.92 0.08  80 / 60%)", color: "oklch(0.48 0.16  70)" },
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={styles[color]}>
      {children}
    </span>
  );
}

// ─── Générateur de clé API ─────────────────────────────────────────────────────

function ApiKeyGenerator() {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ key: string; expires: string } | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  const generate = async () => {
    if (!name.trim() || !email.trim()) { setError("Nom et email requis."); return; }
    if (!email.includes("@")) { setError("Email invalide."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setResult({ key: data.key, expires: data.expires });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      id="get-key"
      className="rounded-3xl overflow-hidden"
      style={{
        background: "oklch(0.97 0.02 285 / 60%)",
        border: "1px solid oklch(0.88 0.06 285 / 50%)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Header */}
      <div className="px-8 py-6 border-b flex items-center gap-4"
        style={{
          borderColor: "oklch(0.88 0.06 285 / 40%)",
          background: "linear-gradient(90deg, oklch(0.93 0.07 280 / 50%), oklch(0.93 0.06 310 / 35%))",
        }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "oklch(0.50 0.20 285)", color: "white" }}>
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Obtenir une clé API</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gratuite · 60 req/min · Valide 1 an · Gérée par Unkey</p>
        </div>
      </div>

      <div className="p-8">
        {!result ? (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Nom ou organisation</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mon Projet Citoyen"
                maxLength={80}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "white",
                  border: "1.5px solid oklch(0.88 0.06 285 / 60%)",
                  color: "oklch(0.25 0.05 285)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.52 0.20 285)")}
                onBlur={(e)  => (e.target.style.borderColor = "oklch(0.88 0.06 285 / 60%)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@example.com"
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "white",
                  border: "1.5px solid oklch(0.88 0.06 285 / 60%)",
                  color: "oklch(0.25 0.05 285)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.52 0.20 285)")}
                onBlur={(e)  => (e.target.style.borderColor = "oklch(0.88 0.06 285 / 60%)")}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-xl"
                style={{ background: "oklch(0.96 0.03 25 / 70%)", color: "oklch(0.45 0.16 25)" }}>
                ⚠️ {error}
              </p>
            )}

            <button
              onClick={generate}
              disabled={loading || !name.trim() || !email.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, oklch(0.52 0.20 285), oklch(0.48 0.18 265))", boxShadow: "0 4px 16px oklch(0.50 0.20 285 / 30%)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Génération en cours…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Key className="w-4 h-4" /> Générer ma clé API
                </span>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              En générant une clé, vous acceptez une utilisation non commerciale des données.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "oklch(0.42 0.18 145)" }}>
              <Check className="w-5 h-5" /> Clé générée avec succès !
            </div>

            <div className="rounded-2xl p-4"
              style={{ background: "oklch(0.14 0.04 285)", border: "1px solid oklch(0.25 0.06 285 / 60%)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: "oklch(0.65 0.10 285)" }}>Votre clé API</span>
                <button
                  onClick={copyKey}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: copied ? "oklch(0.40 0.18 145 / 20%)" : "oklch(0.28 0.06 285 / 60%)",
                    color: copied ? "oklch(0.55 0.18 145)" : "oklch(0.75 0.10 285)",
                  }}
                >
                  {copied ? <><Check className="w-3 h-3" /> Copié !</> : <><Copy className="w-3 h-3" /> Copier</>}
                </button>
              </div>
              <p className="font-mono text-sm break-all" style={{ color: "oklch(0.88 0.08 285)" }}>
                {result.key}
              </p>
            </div>

            <div className="rounded-xl p-3 text-xs space-y-1"
              style={{ background: "oklch(0.92 0.06 80 / 30%)", border: "1px solid oklch(0.85 0.08 80 / 40%)", color: "oklch(0.45 0.14 70)" }}>
              <p className="font-semibold">⚠️ Sauvegardez cette clé maintenant</p>
              <p>Elle ne sera plus affichée. Expiration : {new Date(result.expires).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.</p>
            </div>

            <button
              onClick={() => { setResult(null); setName(""); setEmail(""); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ← Générer une autre clé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Endpoint cards ───────────────────────────────────────────────────────────

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/deputes",
    icon: Users,
    desc: "Liste et recherche des 577 député·es.",
    params: [
      { name: "q",           desc: "Recherche nom, prénom, circonscription" },
      { name: "groupe",      desc: "Sigle du groupe (RN, LFI, EPR, SOC…)" },
      { name: "departement", desc: "Numéro ou nom de département" },
      { name: "page",        desc: "Page (défaut: 1)" },
      { name: "limit",       desc: "Résultats par page (max: 100)" },
    ],
    example: `/api/v1/deputes?groupe=RN&limit=5`,
    response: `{
  "data": [
    {
      "id": "PA793376",
      "slug": "marine-le-pen",
      "prenom": "Marine",
      "nom": "Le Pen",
      "groupe": { "sigle": "RN", "libelle": "Rassemblement National" },
      "circonscription": {
        "numero": 11,
        "nom": "11e circonscription du Pas-de-Calais",
        "departement": "62"
      },
      "url": "https://mandat-fr.is-a.dev/depute/marine-le-pen"
    }
  ],
  "meta": { "total": 125, "page": 1, "pages": 13, "limit": 10 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/scrutins",
    icon: Vote,
    desc: "Liste des scrutins (votes), filtrable par législature, résultat et date.",
    params: [
      { name: "legislature", desc: "17 (actuelle, défaut) ou 16 (2022-2024)" },
      { name: "q",           desc: "Mot-clé dans le titre" },
      { name: "sort",        desc: "adopté | rejeté" },
      { name: "from / to",   desc: "Plage de dates ISO (YYYY-MM-DD)" },
      { name: "page / limit",desc: "Pagination (max: 100)" },
    ],
    example: `/api/v1/scrutins?legislature=17&sort=rejeté&limit=3`,
    response: `{
  "data": [
    {
      "numero": "4921",
      "titre": "sur l'amendement n\u00b0 42 ...",
      "date": "2025-06-12",
      "legislature": 17,
      "sort": "rejeté",
      "votes": {
        "pour": 82,
        "contre": 201,
        "abstentions": 14,
        "total": 297
      },
      "url": "https://mandat-fr.is-a.dev/scrutin/4921"
    }
  ],
  "meta": { "total": 1832, "page": 1, "pages": 611, "limit": 3 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/scrutins/:numero",
    icon: BarChart3,
    desc: "Détail complet d'un scrutin avec calcul automatique de la majorité.",
    params: [
      { name: "numero",      desc: "Numéro du scrutin (ex: 4872)" },
      { name: "legislature", desc: "17 (défaut) ou 16" },
    ],
    example: `/api/v1/scrutins/4872`,
    response: `{
  "data": {
    "numero": "4872",
    "titre": "sur l'ensemble du projet de loi ...",
    "date": "2025-05-28",
    "legislature": 17,
    "sort": "adopté",
    "adopte": true,
    "votes": {
      "pour": 289,
      "contre": 242,
      "abstentions": 26,
      "total": 557,
      "majorite": 279
    },
    "url": "https://mandat-fr.is-a.dev/scrutin/4872"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/groupes",
    icon: BarChart3,
    desc: "Groupes politiques avec effectifs, triés par taille décroissante.",
    params: [],
    example: `/api/v1/groupes`,
    response: `{
  "data": [
    { "sigle": "RN",  "libelle": "Rassemblement National",    "nb_deputes": 126 },
    { "sigle": "EPR", "libelle": "Ensemble pour la République", "nb_deputes": 99 },
    { "sigle": "SOC", "libelle": "Socialistes",                "nb_deputes": 64 }
  ],
  "meta": { "total": 9 }
}`,
  },
];

function EndpointCard({ ep }: { ep: typeof ENDPOINTS[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = ep.icon;

  return (
    <div className="card-glass rounded-3xl overflow-hidden">
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/20 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.90 0.08 285 / 50%)", color: "oklch(0.45 0.18 285)" }}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge color="green">{ep.method}</Badge>
            <code className="text-sm font-mono font-medium text-foreground">{ep.path}</code>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{ep.desc}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: "oklch(0.88 0.05 285 / 40%)" }}>
          {ep.params.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Paramètres</p>
              <div className="space-y-1.5">
                {ep.params.map((p) => (
                  <div key={p.name} className="flex items-start gap-3 text-sm">
                    <code className="shrink-0 text-xs px-2 py-0.5 rounded-lg font-mono"
                      style={{ background: "oklch(0.90 0.08 285 / 40%)", color: "oklch(0.42 0.18 285)" }}>
                      {p.name}
                    </code>
                    <span className="text-muted-foreground text-xs pt-0.5">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Exemple</p>
            <CodeBlock code={`curl https://mandat-fr.is-a.dev${ep.example} \\
  -H "X-Api-Key: mk_live_votre_cle"`} lang="bash" />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Réponse</p>
            <CodeBlock code={ep.response} lang="json" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────

function DevelopersPage() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, oklch(0.70 0.18 285), transparent 70%)" }} />
          <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, oklch(0.72 0.14 240), transparent 70%)" }} />
        </div>
        <div className="container-app relative z-10 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-primary mb-6">
              <Code className="w-3.5 h-3.5" /> API REST publique · v1.0
            </div>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight mb-6">
              Pour les
              <br />
              <span className="text-gradient italic">développeurs.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              Accédez aux données de l’Assemblée nationale en JSON.
              Député·es, scrutins, groupes politiques — mis à jour chaque nuit,
              sous licence ouverte.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#get-key"
                className="btn-primary px-6 py-3 rounded-2xl font-semibold text-sm inline-flex items-center gap-2">
                <Key className="w-4 h-4" /> Obtenir une clé API
              </a>
              <a href="#endpoints"
                className="glass px-6 py-3 rounded-2xl font-medium text-sm border border-border/50 hover:border-primary/40 transition-colors inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Voir la documentation
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container-app py-16 space-y-20">

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Député·es",     value: "577",     color: "purple" },
            { label: "Scrutins",       value: "5 000+",  color: "blue" },
            { label: "Mise à jour",    value: "Nightly", color: "green" },
            { label: "Rate limit",     value: "60/min",  color: "amber" },
          ].map((s) => (
            <div key={s.label} className="card-glass rounded-3xl p-5 text-center">
              <div className="font-display text-3xl font-bold text-foreground mb-1">{s.value}</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Auth rapide */}
        <section>
          <h2 className="font-display text-3xl md:text-4xl mb-2">Authentification</h2>
          <p className="text-muted-foreground mb-6">Passez votre clé dans le header <code className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "oklch(0.90 0.06 285 / 40%)", color: "oklch(0.42 0.18 285)" }}>X-Api-Key</code>, en <code className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "oklch(0.90 0.06 285 / 40%)", color: "oklch(0.42 0.18 285)" }}>Authorization: Bearer</code>, ou en query param.</p>
          <div className="space-y-3">
            <CodeBlock lang="bash" code={`# Header recommandé
curl https://mandat-fr.is-a.dev/api/v1/deputes \\
  -H "X-Api-Key: mk_live_votre_cle"

# Ou Authorization Bearer
curl https://mandat-fr.is-a.dev/api/v1/scrutins \\
  -H "Authorization: Bearer mk_live_votre_cle"

# Ou query param (pratique pour tester)
curl "https://mandat-fr.is-a.dev/api/v1/groupes?api_key=mk_live_votre_cle"`} />

            <CodeBlock lang="javascript" code={`// JavaScript / TypeScript
const res = await fetch("https://mandat-fr.is-a.dev/api/v1/scrutins?limit=10", {
  headers: { "X-Api-Key": process.env.MANDAT_API_KEY },
});
const { data, meta } = await res.json();
console.log(data[0].titre); // "sur l'article 1er..."`} />

            <CodeBlock lang="python" code={`# Python
import requests

headers = {"X-Api-Key": "mk_live_votre_cle"}
res = requests.get(
    "https://mandat-fr.is-a.dev/api/v1/deputes",
    params={"groupe": "LFI", "limit": 20},
    headers=headers,
)
data = res.json()
print(data["meta"]["total"], "députés")`} />
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl mb-1">Endpoints</h2>
              <p className="text-muted-foreground text-sm">Base URL : <code className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "oklch(0.90 0.06 285 / 40%)", color: "oklch(0.42 0.18 285)" }}>https://mandat-fr.is-a.dev/api/v1</code></p>
            </div>
            <a href="/api/v1" target="_blank"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> JSON brut
            </a>
          </div>
          <div className="space-y-3">
            {ENDPOINTS.map((ep) => <EndpointCard key={ep.path} ep={ep} />)}
          </div>
        </section>

        {/* Rate limiting */}
        <section className="card-glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.90 0.08 80 / 50%)", color: "oklch(0.48 0.16 70)" }}>
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="font-display text-2xl">Rate limiting</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>Chaque clé API est limitée à <strong className="text-foreground">60 requêtes par minute</strong>. Les limites sont gérées par <strong className="text-foreground">Unkey</strong>, une plateforme open source de gestion de clés.</p>
              <p>Les headers de réponse indiquent votre consommation en temps réel.</p>
            </div>
            <CodeBlock lang="http" code={`HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1720612800

# Si la limite est dépassée :
HTTP/1.1 429 Too Many Requests
Retry-After: 42`} />
          </div>
        </section>

        {/* Sécurité */}
        <section className="card-glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.90 0.08 145 / 50%)", color: "oklch(0.40 0.18 145)" }}>
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-display text-2xl">Sécurité & licence</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            {[
              { title: "Licence ouverte", desc: "Données sous Licence Ouverte v2.0 (Etalab). Usage non commercial uniquement pour l'API Mandat." },
              { title: "Source officielle", desc: "Toutes les données proviennent de l'AN Open Data, CLAIR et CIVIX. Aucune modification ni interprétation." },
              { title: "Données fraîches", desc: "Mise à jour automatique chaque nuit à 3h UTC via GitHub Actions. Date de dernière sync visible sur /api/status." },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Générateur de clé */}
        <ApiKeyGenerator />

        {/* Footer liens */}
        <div className="flex flex-wrap gap-4 text-sm border-t border-border/40 pt-8">
          <a href="https://github.com/Simonc44/mandat" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Code source GitHub
          </a>
          <a href="/api/status" target="_blank"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Statut de l'API
          </a>
          <a href="https://www.unkey.com" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Powered by Unkey
          </a>
          <Link to="/a-propos"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> À propos de Mandat
          </Link>
        </div>
      </div>
    </div>
  );
}

import type React from "react";
