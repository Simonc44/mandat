// AiChatWidget.tsx
// Bouton flottant IA (logo Gemini sparkle) — 2 requêtes/jour — streaming Groq
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles } from "lucide-react";

const QUOTA_KEY = "mandat_ai_quota_client"; // clé localStorage pour l'affichage
const QUOTA_PER_DAY = 2;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getLocalQuota(): number {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return QUOTA_PER_DAY;
    const [d, c] = raw.split(":");
    if (d !== getTodayKey()) return QUOTA_PER_DAY;
    return Math.max(0, QUOTA_PER_DAY - parseInt(c ?? "0", 10));
  } catch {
    return QUOTA_PER_DAY;
  }
}

function decrementLocalQuota() {
  try {
    const today = getTodayKey();
    const raw = localStorage.getItem(QUOTA_KEY);
    let count = 0;
    if (raw) {
      const [d, c] = raw.split(":");
      count = d === today ? parseInt(c ?? "0", 10) : 0;
    }
    localStorage.setItem(QUOTA_KEY, `${today}:${count + 1}`);
  } catch {}
}

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number>(getLocalQuota);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll auto vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    if (remaining <= 0) {
      setError("Vous avez utilisé vos 2 questions du jour. Revenez demain !");
      return;
    }

    setError(null);
    setInput("");
    setLoading(true);

    // Ajouter le message utilisateur
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    // Ajouter un message assistant vide (streaming)
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setMessages(prev => prev.slice(0, -1)); // retirer le message vide
        setError(data.error ?? "Quota atteint");
        setRemaining(0);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }

      // Décrémenter le quota local
      decrementLocalQuota();
      setRemaining(r => Math.max(0, r - 1));

      // Lire le stream SSE
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const json = JSON.parse(raw);
            // Événement meta (quota)
            if (json.type === "meta") {
              if (typeof json.remaining === "number") setRemaining(json.remaining);
              continue;
            }
            // Delta texte
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                  streaming: true,
                };
                return copy;
              });
            }
          } catch {}
        }
      }

      // Marquer la fin du streaming
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: assistantContent, streaming: false };
        return copy;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setMessages(prev => prev.slice(0, -1));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, remaining]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Ouvrir l'assistant IA"
        className={[
          "fixed right-5 bottom-24 z-[9998] w-14 h-14 rounded-full shadow-2xl",
          "flex items-center justify-center",
          "bg-white border border-white/40",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          open ? "ring-2 ring-primary/60 scale-110" : "",
        ].join(" ")}
        style={{
          background: "linear-gradient(135deg, oklch(0.96 0.04 285), oklch(0.92 0.08 305))",
          boxShadow: "0 8px 32px oklch(0.50 0.20 285 / 35%), 0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <img
          src="https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg"
          alt="IA"
          className="w-8 h-8"
          draggable={false}
        />
        {/* Badge quota */}
        {remaining < QUOTA_PER_DAY && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: remaining === 0 ? "#ef4444" : "oklch(0.50 0.20 285)", color: "white" }}
          >
            {remaining}
          </span>
        )}
      </button>

      {/* ── Panel chat ── */}
      {open && (
        <div
          className="fixed right-5 bottom-44 z-[9999] w-[calc(100vw-2.5rem)] max-w-sm"
          style={{ filter: "drop-shadow(0 16px 48px oklch(0.50 0.20 285 / 25%))" }}
        >
          <div
            className="rounded-[2rem] overflow-hidden border border-white/40 flex flex-col"
            style={{
              background: "oklch(0.98 0.01 285 / 92%)",
              backdropFilter: "blur(24px) saturate(1.6)",
              maxHeight: "min(520px, 70vh)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b border-white/30"
              style={{ background: "linear-gradient(90deg, oklch(0.92 0.08 285 / 60%), oklch(0.92 0.08 305 / 40%))" }}
            >
              <img
                src="https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg"
                alt=""
                className="w-6 h-6 shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-none">Assistant Mandat</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {remaining > 0
                    ? `${remaining} question${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} aujourd'hui`
                    : "Quota du jour atteint — revenez demain"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/50" />
                  <p className="text-sm text-muted-foreground">
                    Posez une question sur les derniers scrutins de l'Assemblée nationale.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {[
                      "Quels sont les derniers votes ?",
                      "Quel scrutin a été le plus serré ?",
                      "Combien de scrutins ont été adoptés ?",
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="text-xs px-3 py-2 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={[
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "text-white rounded-br-sm"
                        : "text-foreground border border-white/40 rounded-bl-sm",
                    ].join(" ")}
                    style={
                      m.role === "user"
                        ? { background: "oklch(0.50 0.20 285)" }
                        : { background: "oklch(0.97 0.01 285 / 80%)" }
                    }
                  >
                    {m.content}
                    {m.streaming && (
                      <span className="inline-block w-1.5 h-4 ml-1 rounded-sm animate-pulse" style={{ background: "oklch(0.50 0.20 285)" }} />
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="text-center py-2">
                  <p className="text-xs text-destructive/80 bg-destructive/8 rounded-xl px-3 py-2">{error}</p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-white/30">
              <div
                className="flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all duration-200"
                style={{ background: "oklch(0.97 0.01 285 / 70%)", borderColor: "oklch(0.80 0.05 285 / 60%)" }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={remaining > 0 ? "Posez votre question…" : "Quota du jour atteint"}
                  disabled={remaining <= 0 || loading}
                  rows={1}
                  maxLength={500}
                  className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground disabled:opacity-50 max-h-28 min-h-[1.5rem]"
                  style={{ scrollbarWidth: "none" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || remaining <= 0}
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  style={{ background: "oklch(0.50 0.20 285)", color: "white" }}
                  aria-label="Envoyer"
                >
                  {loading
                    ? <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
                IA neutre · Données officielles AN · {input.length}/500
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
