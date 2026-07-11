// components/FollowButton.tsx
// Bouton "🔔 Suivre ce député" — abonné aux alertes email quotidiennes
// À intégrer dans la page depute.$slug.tsx

import { useState } from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";

interface FollowButtonProps {
  deputeSlug: string;
  deputeNom: string;
}

export function FollowButton({ deputeSlug, deputeNom }: FollowButtonProps) {
  const [step, setStep]   = useState<"idle" | "form" | "loading" | "success" | "already">("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const subscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Email invalide.");
      return;
    }
    setError(null);
    setStep("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), depute_slug: deputeSlug }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      if (data.already) {
        setStep("already");
      } else {
        setStep("success");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setStep("form");
    }
  };

  // ─ Bouton initial
  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("form")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium border transition-all hover:scale-105 active:scale-95"
        style={{
          background: "oklch(0.96 0.04 285 / 60%)",
          borderColor: "oklch(0.86 0.08 285 / 50%)",
          color: "oklch(0.42 0.18 285)",
        }}
      >
        <Bell className="w-4 h-4" />
        Suivre ce député
      </button>
    );
  }

  // ─ Succès
  if (step === "success" || step === "already") {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium"
        style={{
          background: "oklch(0.92 0.08 145 / 40%)",
          border: "1px solid oklch(0.80 0.10 145 / 50%)",
          color: "oklch(0.38 0.16 145)",
        }}
      >
        <Check className="w-4 h-4" />
        {step === "already" ? "Déjà abonné — checké !" : "Abonné ! Un email de confirmation a été envoyé."}
      </div>
    );
  }

  // ─ Formulaire email
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: "oklch(0.96 0.04 285 / 60%)",
        border: "1px solid oklch(0.86 0.08 285 / 50%)",
      }}
    >
      <p className="text-xs font-medium" style={{ color: "oklch(0.38 0.14 285)" }}>
        <Bell className="w-3.5 h-3.5 inline mr-1" />
        Recevez un email chaque fois que <strong>{deputeNom}</strong> vote.
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && subscribe()}
          placeholder="votre@email.fr"
          autoFocus
          maxLength={200}
          disabled={step === "loading"}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
          style={{
            background: "white",
            border: "1.5px solid oklch(0.86 0.08 285 / 60%)",
            color: "oklch(0.25 0.05 285)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "oklch(0.52 0.20 285)")}
          onBlur={(e)  => (e.target.style.borderColor = "oklch(0.86 0.08 285 / 60%)")}
        />
        <button
          onClick={subscribe}
          disabled={step === "loading" || !email.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{
            background: "linear-gradient(135deg, oklch(0.52 0.20 285), oklch(0.48 0.18 265))",
            boxShadow: "0 2px 8px oklch(0.50 0.20 285 / 25%)",
          }}
        >
          {step === "loading"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : "S'abonner"}
        </button>
        <button
          onClick={() => { setStep("idle"); setEmail(""); setError(null); }}
          className="px-2 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/50 transition-colors"
          aria-label="Annuler"
        >
          <BellOff className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "oklch(0.45 0.16 25)" }}>⚠️ {error}</p>
      )}

      <p className="text-[10px]" style={{ color: "oklch(0.65 0.06 285)" }}>
        Gratuit · Désabonnement en 1 clic · Aucun spam · RGPD
      </p>
    </div>
  );
}
