// routes/desabonnement.tsx — Gestion des abonnements avec Google Sign-In
// Le client_id Google est lu depuis VITE_GOOGLE_CLIENT_ID (variable d'env publique)

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Check,
  Trash2,
  ArrowLeft,
  LogOut,
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            options: { theme?: string; size?: string; width?: string },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const Route = createFileRoute("/desabonnement")({
  head: () => ({
    meta: createSeoMeta({
      title: "Gérer mes abonnements aux alertes — Mandat",
      description:
        "Connectez-vous avec Google pour consulter, gérer ou supprimer vos abonnements aux alertes de vote des députés.",
      canonical: `${SITE_URL}/desabonnement`,
    }),
    links: createSeoLinks(`${SITE_URL}/desabonnement`),
  }),
  component: DesabonnementPage,
});

interface Subscription {
  id: string;
  depute_slug: string;
  depute_nom: string;
  created_at: string;
}

interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
  credential: string;
}

function decodeGoogleJwt(
  token: string,
): { email: string; name?: string; picture?: string } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// ── Bouton Google Liquid Glass ──────────────────────────────────────────────

function GoogleSignInButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full max-w-xs mx-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.60) 100%)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        border: "1.5px solid rgba(255,255,255,0.70)",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {/* Reflet supérieur */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
        }}
      />

      {/* Logo Google SVG officiel */}
      <svg
        className="w-5 h-5 shrink-0 relative z-10"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>

      <span
        className="relative z-10 text-sm font-semibold tracking-tight"
        style={{ color: "oklch(0.25 0.04 285)" }}
      >
        Continuer avec Google
      </span>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(66,133,244,0.06) 0%, rgba(52,168,83,0.04) 100%)",
        }}
      />
    </button>
  );
}

// ── Page principale ─────────────────────────────────────────────────────────

function DesabonnementPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  // Client ID depuis variable d'env Vite (publique, préfixée VITE_)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    const saved = localStorage.getItem("mandat_auth_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        setUser(parsed);
        fetchSubscriptions(parsed.credential);
      } catch {
        localStorage.removeItem("mandat_auth_user");
      }
    }

    if (!clientId) return; // Pas de client ID → pas de bouton Google

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleReady(true);
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const profile = decodeGoogleJwt(response.credential);
            if (profile?.email) {
              const up: UserProfile = {
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                credential: response.credential,
              };
              setUser(up);
              localStorage.setItem("mandat_auth_user", JSON.stringify(up));
              setMessage(null);
              fetchSubscriptions(response.credential);
            } else {
              setMessage({
                type: "error",
                text: "Impossible de récupérer les informations de votre compte Google.",
              });
            }
          },
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [clientId]);

  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const fetchSubscriptions = async (credential: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des abonnements.");
      const data = await res.json();
      setSubscriptions(data);
      setSelectedIds(new Set(data.map((s: Subscription) => s.id)));
    } catch {
      setMessage({ type: "error", text: "Impossible de charger vos abonnements." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSubscriptions([]);
    setSelectedIds(new Set());
    setMessage(null);
    localStorage.removeItem("mandat_auth_user");
  };

  const handleToggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === subscriptions.length
        ? new Set()
        : new Set(subscriptions.map((s) => s.id)),
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size || !user) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/delete-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: user.credential,
          ids: Array.from(selectedIds),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression.");
      const count = selectedIds.size;
      setSubscriptions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      setMessage({
        type: "success",
        text: `Désabonnement confirmé pour ${count} député${count > 1 ? "s" : ""}. Vous ne recevrez plus d'alertes.`,
      });
    } catch (e: unknown) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Une erreur est survenue.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-app py-12 md:py-20 max-w-2xl mx-auto">
      <nav className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </nav>

      {/* En-tête */}
      <header className="mb-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 mx-auto">
          <ShieldAlert className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl mb-3 tracking-tight">
          Gérer mes abonnements
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Connectez-vous avec Google pour consulter et supprimer vos alertes de vote.
        </p>
      </header>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-sm flex gap-3 items-start animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {message.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              "⚠️"
            )}
          </div>
          <p>{message.text}</p>
        </div>
      )}

      {/* Phase 1 : connexion */}
      {!user ? (
        <div className="card-glass rounded-[2rem] p-10 border border-border/40 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-xl tracking-tight">
              Connexion sécurisée
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Nous utilisons Google pour vérifier que l'adresse email vous
              appartient avant d'afficher ou de supprimer vos abonnements.
            </p>
          </div>

          {clientId ? (
            <div className="flex flex-col items-center gap-4">
              <GoogleSignInButton onClick={handleGoogleClick} />
              <p className="text-[10px] text-muted-foreground">
                Connexion sécurisée · Aucun mot de passe stocké · RGPD
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-5 text-sm text-left space-y-2"
              style={{
                background: "oklch(0.96 0.03 80 / 50%)",
                border: "1px solid oklch(0.88 0.06 80 / 50%)",
                color: "oklch(0.45 0.12 70)",
              }}
            >
              <p className="font-semibold">⚙️ Configuration requise</p>
              <p className="text-xs leading-relaxed">
                Ajoutez la variable d'environnement{" "}
                <code
                  className="px-1.5 py-0.5 rounded-md text-[11px] font-mono"
                  style={{ background: "oklch(0.90 0.06 80 / 40%)" }}
                >
                  VITE_GOOGLE_CLIENT_ID
                </code>{" "}
                dans Vercel avec votre Client ID Google OAuth 2.0.
              </p>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold underline"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Phase 2 : dashboard */
        <div className="space-y-6">
          {/* Profil */}
          <div className="card-glass rounded-2xl p-4 border border-border/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name ?? "Avatar"}
                  className="w-10 h-10 rounded-full border border-primary/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Connecté avec Google
                </div>
                <div className="text-sm font-semibold truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Déconnexion
            </button>
          </div>

          {/* Abonnements */}
          <div className="card-glass rounded-[2rem] p-6 sm:p-8 border border-border/40 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg tracking-tight">
                Abonnements actifs ({subscriptions.length})
              </h2>
              {subscriptions.length > 0 && (
                <button
                  onClick={handleToggleSelectAll}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {selectedIds.size === subscriptions.length
                    ? "Tout désélectionner"
                    : "Tout sélectionner"}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs">Chargement de vos abonnements…</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="text-4xl">📭</div>
                <div>
                  <h3 className="font-semibold text-sm">Aucun abonnement actif</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                    Vous ne suivez aucun député avec cette adresse email.
                  </p>
                </div>
                <Link
                  to="/deputes"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  Parcourir les député·es{" "}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => {
                  const checked = selectedIds.has(sub.id);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        const next = new Set(selectedIds);
                        if (next.has(sub.id)) next.delete(sub.id);
                        else next.add(sub.id);
                        setSelectedIds(next);
                      }}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/40 hover:border-border/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {sub.depute_nom}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            Abonné le{" "}
                            {new Date(sub.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/depute/${sub.depute_slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold glass border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors shrink-0"
                      >
                        Fiche →
                      </Link>
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    {selectedIds.size} sélectionné(s)
                  </p>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={actionLoading || selectedIds.size === 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Supprimer les abonnements sélectionnés
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
