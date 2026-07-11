// routes/desabonnement.tsx — Page de désabonnement et de gestion des abonnements par Google Sign-In

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Check,
  Trash2,
  ArrowLeft,
  LogOut,
  Mail,
  Sparkles,
  UserCheck,
  Loader2,
  Calendar,
  ExternalLink
} from "lucide-react";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

// Types globaux pour Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement | null, options: { theme?: string; size?: string; width?: string }) => void;
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
      description: "Connectez-vous de manière sécurisée avec Google pour consulter, gérer ou supprimer vos abonnements aux alertes de vote des députés.",
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
  credential: string; // Stocker le JWT ou le token de simulation
}

// Fonction pour décoder le JWT de Google de manière sécurisée et légère
function decodeGoogleJwt(token: string): { email: string; name?: string; picture?: string } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erreur de décodage du token Google JWT:", error);
    return null;
  }
}

function DesabonnementPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Simulation de connexion pour les environnements de test / local ou si les clés Google manquent
  const [simEmail, setSimEmail] = useState("");
  const [simError, setSimError] = useState("");

  // Charger l'API Google Identity Services
  useEffect(() => {
    // Vérifier si l'utilisateur est déjà stocké en local pour la session
    const savedUser = localStorage.getItem("mandat_auth_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as UserProfile;
        setUser(parsed);
        fetchSubscriptions(parsed.credential);
      } catch (e) {
        localStorage.removeItem("mandat_auth_user");
      }
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogleSignIn();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: "788417855681-3g32890scg7on4tq0fksb5aocn9s6u10.apps.googleusercontent.com",
        callback: (response) => {
          const profile = decodeGoogleJwt(response.credential);
          if (profile && profile.email) {
            const userProfile: UserProfile = {
              email: profile.email,
              name: profile.name,
              picture: profile.picture,
              credential: response.credential,
            };
            setUser(userProfile);
            localStorage.setItem("mandat_auth_user", JSON.stringify(userProfile));
            setMessage(null);
            fetchSubscriptions(response.credential);
          } else {
            setMessage({ type: "error", text: "Impossible de récupérer les informations de votre compte Google." });
          }
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", width: "100%" }
      );
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
      // Sélectionner tout par défaut
      setSelectedIds(new Set(data.map((sub: Subscription) => sub.id)));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Impossible de charger vos abonnements." });
    } finally {
      setLoading(false);
    }
  };

  // Simuler la connexion avec un email de test
  const handleSimulationLogin = () => {
    if (!simEmail.trim() || !simEmail.includes("@")) {
      setSimError("Veuillez saisir une adresse email valide.");
      return;
    }
    setSimError("");

    const email = simEmail.trim().toLowerCase();
    const simToken = `simulation-token:${email}`;

    const simProfile: UserProfile = {
      email,
      name: "Utilisateur Test",
      picture: undefined,
      credential: simToken,
    };
    setUser(simProfile);
    localStorage.setItem("mandat_auth_user", JSON.stringify(simProfile));
    setMessage(null);
    fetchSubscriptions(simToken);
  };

  const handleLogout = () => {
    setUser(null);
    setSubscriptions([]);
    setSelectedIds(new Set());
    setMessage(null);
    localStorage.removeItem("mandat_auth_user");
    // Re-render google button inside next frame
    setTimeout(() => {
      initializeGoogleSignIn();
    }, 100);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === subscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subscriptions.map((sub) => sub.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || !user) return;

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

      // Filtrer les abonnements supprimés
      const remaining = subscriptions.filter((sub) => !selectedIds.has(sub.id));
      setSubscriptions(remaining);
      setSelectedIds(new Set());
      setMessage({
        type: "success",
        text: `Vos désabonnements ont bien été pris en compte. Vous ne recevrez plus d'alertes pour ${selectedIds.size === 1 ? "ce député" : "ces députés"}.`
      });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Une erreur est survenue lors du désabonnement."
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

      {/* ── EN-TÊTE ── */}
      <header className="mb-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 mx-auto">
          <ShieldAlert className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl mb-3 tracking-tight">
          Gérer mes abonnements
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Pour garantir la sécurité de vos données, nous vérifions que l'adresse email vous appartient grâce à la connexion sécurisée de Google.
        </p>
      </header>

      {message && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-sm flex gap-3 items-start animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {message.type === "success" ? <Check className="w-4 h-4" /> : "⚠️"}
          </div>
          <p>{message.text}</p>
        </div>
      )}

      {/* ── PHASE 1 : CONNEXION REQUISE ── */}
      {!user ? (
        <div className="space-y-6">
          <div className="card-glass rounded-[2rem] p-8 border border-border/40 text-center space-y-6">
            <h2 className="font-display text-xl tracking-tight">Authentification Google</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Cliquez ci-dessous pour vous connecter. Cela nous permettra de retrouver instantanément tous les députés que vous suivez.
            </p>

            <div className="flex justify-center py-2 max-w-xs mx-auto">
              <div id="google-signin-btn" className="w-full min-h-[44px]"></div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              Connexion sécurisée par Google Identity Services
            </div>
          </div>

          {/* SIMULATEUR DE TEST POUR LOCAL / DÉVELOPPEMENT */}
          <div className="card-glass rounded-[1.5rem] p-6 border border-primary/20 bg-primary/5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Mode Simulation / Test de l'interface
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Utile pour valider l'interface en local ou si vous n'avez pas de configuration Google active.
            </p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    placeholder="Saisissez un email de test..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-background border border-border/60 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  onClick={handleSimulationLogin}
                  className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary/90 transition-colors shrink-0"
                >
                  Se connecter (Simulation)
                </button>
              </div>
              {simError && (
                <p className="text-[11px] text-destructive">⚠️ {simError}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── PHASE 2 : DASHBOARD DES ABONNEMENTS ── */
        <div className="space-y-6">
          {/* Bannière profil utilisateur */}
          <div className="card-glass rounded-2xl p-4 border border-border/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "Avatar"}
                  className="w-10 h-10 rounded-full border border-primary/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(user.name || user.email).substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  Connecté avec Google
                </div>
                <div className="text-sm font-semibold truncate text-foreground">{user.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Se déconnecter
            </button>
          </div>

          {/* Liste des abonnements actifs */}
          <div className="card-glass rounded-[2rem] p-6 sm:p-8 border border-border/40 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg tracking-tight">
                Vos abonnements actifs ({subscriptions.length})
              </h2>
              {subscriptions.length > 0 && (
                <button
                  onClick={handleToggleSelectAll}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {selectedIds.size === subscriptions.length ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs">Recherche de vos abonnements en cours...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground text-xl">
                  📭
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Aucun abonnement actif</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                    Vous n'êtes abonné à aucun député avec cette adresse email actuellement.
                  </p>
                </div>
                <Link
                  to="/deputes"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  Découvrir les députés et s'abonner <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => {
                  const isChecked = selectedIds.has(sub.id);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleToggleSelect(sub.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "border-primary/40 bg-primary/5 shadow-sm"
                          : "border-border/40 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Géré par le clic sur le conteneur
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {sub.depute_nom}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            Abonné le {new Date(sub.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/depute/${sub.depute_slug}`}
                        onClick={(e) => e.stopPropagation()} // Éviter de déclencher la sélection du checkbox
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline glass border border-primary/20 px-3 py-1.5 rounded-xl transition-colors hover:bg-primary/5 shrink-0"
                      >
                        Fiche député →
                      </Link>
                    </div>
                  );
                })}

                {/* Bouton d'action collective */}
                <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    {selectedIds.size} abonnement(s) sélectionné(s)
                  </div>
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
