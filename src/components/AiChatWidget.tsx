// AiChatWidget.tsx
// Bouton flottant IA — logo Gemini SVG — sans limite arbitraire
// L'erreur de quota Groq est affichée proprement si l'API est saturée
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, RefreshCw } from "lucide-react";

// ─── Icone Gemini (SVG officiel) ────────────────────────────────────────
function GeminiIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
        fill="url(#gemini_grad)"
      />
      <defs>
        <radialGradient
          id="gemini_grad"
          cx="0" cy="0" r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"
        >
          <stop offset=".067" stopColor="#9168C0" />
          <stop offset=".343" stopColor="#5684D1" />
          <stop offset=".672" stopColor="#1BA1E3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isError?: boolean;
}

const SUGGESTIONS = [
  "Quels sont les derniers votes ?",
  "Quel scrutin a été le plus serré ?",
  "Combien de lois ont été adoptées ?",
  "Y a-t-il eu des votes à l'unanimité ?",
];

// ─── Composant principal ───────────────────────────────────────────────────
export function AiChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Scroll auto
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Escape pour fermer
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  // Clic en dehors pour fermer
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = document.getElementById("ai-fab");
        if (btn && btn.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const sendMessage = useCallback(async (overrideMsg?: string) => {
    const msg = (overrideMsg ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setLoading(true);
    setRateLimited(false);

    setMessages(prev => [
      ...prev,
      { role: "user", content: msg },
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      // Quota Groq dépassé
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: data.error ?? "L'assistant IA est temporairement indisponible. Le quota de l'API a été atteint. Réessayez dans quelques instants.",
            isError: true,
          },
        ]);
        setRateLimited(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }

      // Lire le stream SSE
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let content   = "";

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
            if (json.type === "meta") continue;
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              content += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content, streaming: true };
                return copy;
              });
            }
          } catch {}
        }
      }

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content, streaming: false };
        return copy;
      });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Erreur inconnue";
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: `⚠️ ${errMsg}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setRateLimited(false);
    setInput("");
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* ── Bouton flottant (FAB) ── */}
      <button
        id="ai-fab"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"}
        aria-expanded={open}
        className={[
          "fixed right-5 bottom-24 z-[9998]",
          "w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-300",
          "hover:scale-110 active:scale-95",
          open
            ? "scale-110 shadow-[0_0_0_3px_oklch(0.70_0.16_265/40%),0_8px_32px_oklch(0.50_0.20_285/40%)]"
            : "shadow-[0_4px_24px_oklch(0.50_0.20_285/30%),0_1px_4px_rgba(0,0,0,0.15)]",
        ].join(" ")}
        style={{ background: "white" }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg,#9168C0,#5684D1,#1BA1E3)" }}
        />
        <GeminiIcon size={28} />
      </button>

      {/* ── Panneau chat ── */}
      <div
        ref={panelRef}
        className={[
          "fixed right-5 z-[9999]",
          "w-[min(420px,calc(100vw-2.5rem))]",
          "transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
        style={{ bottom: "calc(6rem + 3.75rem + 0.75rem)" }}
        aria-hidden={!open}
      >
        <div
          className="rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: "oklch(0.985 0.005 285 / 92%)",
            backdropFilter: "blur(32px) saturate(1.8)",
            border: "1px solid oklch(0.90 0.04 285 / 60%)",
            boxShadow: "0 24px 64px oklch(0.50 0.20 285 / 20%), 0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: "min(560px, 72vh)",
          }}
        >
          {/* —— Header —— */}
          <div
            className="flex items-center gap-3 px-5 py-3.5 shrink-0"
            style={{
              background: "linear-gradient(90deg, oklch(0.94 0.06 280 / 70%), oklch(0.94 0.06 310 / 50%))",
              borderBottom: "1px solid oklch(0.90 0.04 285 / 50%)",
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "white", boxShadow: "0 2px 8px oklch(0.50 0.20 285 / 20%)" }}>
              <GeminiIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-none">Assistant Mandat</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                {rateLimited ? "Quota atteint — réessayez plus tard" : "Données officielles AN en temps réel"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {hasMessages && (
                <button
                  onClick={clearChat}
                  title="Nouvelle conversation"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/50 transition-colors"
                  aria-label="Effacer la conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/50 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* —— Zone messages —— */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
            style={{ scrollbarWidth: "thin", scrollbarColor: "oklch(0.80 0.04 285) transparent" }}>
            {!hasMessages && (
              <div className="py-4">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, oklch(0.94 0.08 280), oklch(0.94 0.08 310))" }}>
                    <GeminiIcon size={28} />
                  </div>
                  <p className="font-semibold text-sm text-foreground">Posez une question</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    J'ai accès aux derniers scrutins de l'Assemblée nationale.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left text-xs px-3 py-2.5 rounded-2xl border transition-all duration-150 hover:scale-[1.02] active:scale-95"
                      style={{
                        borderColor: "oklch(0.88 0.05 285 / 80%)",
                        background: "oklch(0.97 0.02 285 / 60%)",
                        color: "oklch(0.35 0.10 285)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={["flex gap-2", m.role === "user" ? "justify-end" : "justify-start items-end"].join(" ")}
              >
                {/* Avatar assistant */}
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mb-0.5"
                    style={{ background: "white", boxShadow: "0 1px 6px oklch(0.50 0.20 285 / 20%)" }}>
                    <GeminiIcon size={14} />
                  </div>
                )}

                <div
                  className={[
                    "max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "rounded-3xl rounded-br-lg"
                      : m.isError
                      ? "rounded-3xl rounded-bl-lg border"
                      : "rounded-3xl rounded-bl-lg border",
                  ].join(" ")}
                  style={
                    m.role === "user"
                      ? {
                          background: "linear-gradient(135deg, oklch(0.52 0.20 285), oklch(0.48 0.18 265))",
                          color: "white",
                          boxShadow: "0 2px 12px oklch(0.50 0.20 285 / 30%)",
                        }
                      : m.isError
                      ? {
                          background: "oklch(0.97 0.02 20 / 80%)",
                          borderColor: "oklch(0.88 0.06 20 / 60%)",
                          color: "oklch(0.45 0.15 20)",
                        }
                      : {
                          background: "oklch(0.97 0.01 285 / 80%)",
                          borderColor: "oklch(0.90 0.04 285 / 60%)",
                          color: "oklch(0.25 0.04 285)",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }
                  }
                >
                  {m.content || (m.streaming ? "" : "")}
                  {m.streaming && (
                    <span
                      className="inline-block w-2 h-4 ml-0.5 rounded-sm animate-pulse align-middle"
                      style={{ background: "oklch(0.60 0.16 285)" }}
                    />
                  )}
                  {!m.content && m.streaming && (
                    <span className="flex gap-1 items-center">
                      {[0,1,2].map(j => (
                        <span key={j} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: "oklch(0.60 0.16 285)", animationDelay: `${j*120}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* —— Input —— */}
          <div className="px-4 pb-4 pt-3 shrink-0"
            style={{ borderTop: "1px solid oklch(0.92 0.04 285 / 50%)" }}>
            <div
              className="flex items-end gap-2 rounded-2xl px-3.5 py-2.5 transition-all duration-200"
              style={{
                background: "oklch(0.98 0.01 285 / 80%)",
                border: "1.5px solid oklch(0.86 0.06 285 / 70%)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
                }}
                onKeyDown={handleKey}
                placeholder={rateLimited ? "Quota atteint — réessayez plus tard" : "Posez votre question…"}
                disabled={loading}
                rows={1}
                maxLength={500}
                className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground/60 disabled:opacity-50 leading-relaxed"
                style={{ scrollbarWidth: "none", minHeight: "1.5rem", maxHeight: "7rem" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, oklch(0.52 0.20 285), oklch(0.48 0.18 265))"
                    : "oklch(0.88 0.04 285)",
                  color: "white",
                  boxShadow: input.trim() && !loading ? "0 2px 8px oklch(0.50 0.20 285 / 35%)" : "none",
                }}
                aria-label="Envoyer"
              >
                {loading
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-muted-foreground/50">
                IA neutre · Données officielles AN
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                {input.length > 0 ? `${input.length}/500` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
