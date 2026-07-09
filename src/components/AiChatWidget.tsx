// AiChatWidget.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { X, RefreshCw } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

function GeminiIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#gm_grad)" />
      <defs>
        <radialGradient id="gm_grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)">
          <stop offset=".067" stopColor="#9168C0" />
          <stop offset=".343" stopColor="#5684D1" />
          <stop offset=".672" stopColor="#1BA1E3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="M12 2.293l7.354 7.353-1.414 1.415L13 6.121V21h-2V6.121l-4.94 4.94-1.414-1.415z" />
    </svg>
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isError?: boolean;
}

const SUGGESTION = "Quels sont les derniers votes ?";

function AssistantBubble({ message }: { message: Message }) {
  const isStreaming = message.streaming;
  const isEmpty = !message.content;
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: message.isError ? "oklch(0.97 0.02 25 / 85%)" : "oklch(0.97 0.01 285 / 82%)",
        border: message.isError ? "1px solid oklch(0.88 0.07 25 / 60%)" : "1px solid oklch(0.90 0.04 285 / 55%)",
        borderBottomLeftRadius: "0.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        maxWidth: "88%",
      }}
    >
      {isStreaming && isEmpty ? (
        <div className="px-4 py-3 flex gap-1 items-center h-10">
          {[0, 1, 2].map((j) => (
            <span key={j} className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: "oklch(0.60 0.16 285)", animationDelay: `${j * 120}ms` }} />
          ))}
        </div>
      ) : (
        <div className="px-4 py-3">
          {message.isError ? (
            <p className="text-[13px] leading-relaxed" style={{ color: "oklch(0.42 0.14 25)" }}>{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          {isStreaming && !isEmpty && (
            <span className="inline-block w-2 h-4 ml-0.5 rounded-sm animate-pulse align-middle"
              style={{ background: "oklch(0.60 0.16 285)" }} />
          )}
        </div>
      )}
    </div>
  );
}

export function AiChatWidget() {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (document.getElementById("ai-fab")?.contains(e.target as Node)) return;
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
    if (inputRef.current) inputRef.current.style.height = "auto";
    setMessages((prev) => [
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
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [...prev.slice(0, -1), {
          role: "assistant",
          content: data.error ?? "⏳ Quota atteint. Réessayez dans quelques instants.",
          isError: true,
        }]);
        setRateLimited(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "", content = "";
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
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              content += delta;
              setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = { role: "assistant", content, streaming: true }; return copy; });
            }
          } catch { /* ignore */ }
        }
      }
      setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = { role: "assistant", content, streaming: false }; return copy; });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Erreur inconnue";
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: `⚠️ ${errMsg}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setRateLimited(false); setInput(""); };
  const hasMessages = messages.length > 0;

  return (
    <>
      {/* FAB */}
      <button
        id="ai-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"}
        aria-expanded={open}
        className={[
          "fixed right-5 bottom-24 z-[9998] w-14 h-14 rounded-full",
          "flex items-center justify-center bg-white",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          open
            ? "scale-110 shadow-[0_0_0_3px_oklch(0.70_0.16_265/40%),0_8px_32px_oklch(0.50_0.20_285/40%)]"
            : "shadow-[0_4px_24px_oklch(0.50_0.20_285/25%),0_1px_4px_rgba(0,0,0,0.12)]",
        ].join(" ")}
      >
        <div className="absolute inset-0 rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg,#9168C0,#5684D1,#1BA1E3)" }} />
        <GeminiIcon size={28} />
      </button>

      {/* Panneau */}
      <div
        ref={panelRef}
        className={[
          "fixed right-5 z-[9999]",
          "w-[min(400px,calc(100vw-2.5rem))]",
          "transition-all duration-300 origin-bottom-right",
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
        style={{ bottom: "calc(6rem + 3.75rem + 0.75rem)" }}
        aria-hidden={!open}
      >
        <div
          className="rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: "oklch(0.985 0.005 285 / 94%)",
            backdropFilter: "blur(32px) saturate(1.8)",
            border: "1px solid oklch(0.90 0.04 285 / 55%)",
            boxShadow: "0 24px 64px oklch(0.50 0.20 285 / 18%), 0 4px 16px rgba(0,0,0,0.10)",
            maxHeight: "min(580px, 76vh)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background: "linear-gradient(90deg, oklch(0.93 0.07 280 / 65%), oklch(0.93 0.06 310 / 45%))",
              borderBottom: "1px solid oklch(0.90 0.04 285 / 45%)",
            }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white"
              style={{ boxShadow: "0 2px 8px oklch(0.50 0.20 285 / 18%)" }}>
              <GeminiIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-none">Assistant Mandat</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${rateLimited ? "bg-amber-400" : "bg-green-500"}`} />
                {rateLimited ? "Quota atteint — réessayez dans quelques secondes" : "Accès Turso en temps réel · Function calling"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {hasMessages && (
                <button onClick={clearChat} title="Nouvelle conversation"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/50 transition-colors"
                  aria-label="Effacer">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/50 transition-colors"
                aria-label="Fermer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
            style={{ scrollbarWidth: "thin", scrollbarColor: "oklch(0.82 0.04 285) transparent" }}
          >
            {!hasMessages && (
              <div className="py-2">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white"
                    style={{ boxShadow: "0 4px 16px oklch(0.50 0.20 285 / 18%)" }}>
                    <GeminiIcon size={28} />
                  </div>
                  <p className="font-semibold text-sm text-foreground">Posez une question</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Accès en direct à la base de données : députés, scrutins 17e &amp; 16e, blog.
                  </p>
                </div>
                <button
                  onClick={() => sendMessage(SUGGESTION)}
                  className="w-full text-left text-xs px-4 py-3 rounded-2xl border transition-all duration-150 hover:scale-[1.01] active:scale-95 leading-snug"
                  style={{
                    borderColor: "oklch(0.88 0.05 285 / 70%)",
                    background: "oklch(0.97 0.02 285 / 55%)",
                    color: "oklch(0.38 0.10 285)",
                  }}
                >
                  {SUGGESTION}
                </button>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={["flex gap-2", m.role === "user" ? "justify-end" : "justify-start items-end"].join(" ")}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mb-0.5 bg-white"
                    style={{ boxShadow: "0 1px 6px oklch(0.50 0.20 285 / 18%)" }}>
                    <GeminiIcon size={14} />
                  </div>
                )}
                {m.role === "user" ? (
                  <div className="max-w-[80%] px-4 py-3 text-sm leading-relaxed rounded-3xl"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.52 0.20 285), oklch(0.48 0.18 265))",
                      color: "white",
                      borderBottomRightRadius: "0.5rem",
                      boxShadow: "0 2px 12px oklch(0.50 0.20 285 / 28%)",
                    }}>
                    {m.content}
                  </div>
                ) : (
                  <AssistantBubble message={m} />
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Barre d'envoi — largeur réduite */}
          <div
            className="px-3 pb-3 pt-2.5 shrink-0"
            style={{ borderTop: "1px solid oklch(0.92 0.04 285 / 45%)" }}
          >
            <div
              className="flex items-center gap-1.5 rounded-xl px-3"
              style={{
                background: "white",
                border: "1.5px solid oklch(0.90 0.04 285 / 50%)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                minHeight: "2.6rem",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                }}
                onKeyDown={handleKey}
                placeholder={loading ? "Interrogation de la base…" : "Posez votre question…"}
                disabled={loading}
                rows={1}
                maxLength={500}
                className="flex-1 bg-transparent resize-none outline-none text-xs placeholder:text-muted-foreground/50 disabled:opacity-50 leading-relaxed py-2.5"
                style={{ scrollbarWidth: "none", minHeight: "1.4rem", maxHeight: "6rem" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, oklch(0.52 0.20 285), oklch(0.48 0.18 265))"
                    : "oklch(0.90 0.03 285)",
                  color: "white",
                  boxShadow: input.trim() && !loading ? "0 2px 6px oklch(0.50 0.20 285 / 30%)" : "none",
                }}
                aria-label="Envoyer"
              >
                {loading
                  ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <SendIcon />}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/40 text-center mt-1.5">
              Données officielles AN · Shift+Enter pour saut de ligne
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
