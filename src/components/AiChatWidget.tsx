// AiChatWidget.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { X, RefreshCw, MoreVertical, Database } from "lucide-react";
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
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

const SUGGESTIONS = [
  "Quels sont les derniers scrutins ?",
  "Cherche les députés à Paris",
  "Quelles sont les nouveautés du blog ?"
];

function DatabaseSearchAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const steps = [
      "Connexion à la base de données Mandat...",
      "Analyse de la demande citoyenne...",
      "Interrogation de la base Turso...",
      "Récupération des scrutins récents...",
      "Traitement et synthèse des données..."
    ];

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const currentText = [
    "Connexion à la base de données Mandat...",
    "Analyse de la demande citoyenne...",
    "Interrogation de la base Turso...",
    "Récupération des scrutins récents...",
    "Traitement et synthèse des données..."
  ][step];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/80 my-2 animate-fade-in w-full max-w-[95%]">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <Database className="w-4 h-4 animate-bounce" />
          <span className="absolute inset-0 rounded-lg border border-indigo-500 animate-ping opacity-20"></span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-800">Assistant Mandat</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-medium transition-all duration-300">
              {currentText}
            </span>
          </div>
        </div>
      </div>

      {/* Visual scanning/progress line */}
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 rounded-full animate-[shimmer_1.5s_infinite]"
             style={{
               animation: "databaseScan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite"
             }}
        />
      </div>

      <style>{`
        @keyframes databaseScan {
          0% { left: -30%; width: 30%; }
          50% { width: 40%; }
          100% { left: 110%; width: 30%; }
        }
      `}</style>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  const isStreaming = message.streaming;
  const isEmpty = !message.content;
  return (
    <div className="w-full">
      {isStreaming && isEmpty ? (
        <DatabaseSearchAnimation />
      ) : (
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: message.isError ? "oklch(0.97 0.02 25 / 85%)" : "transparent",
            border: message.isError ? "1px solid oklch(0.88 0.07 25 / 60%)" : "none",
            maxWidth: "100%",
          }}
        >
          <div className="px-1 py-1">
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
          "flex items-center justify-center bg-white border border-slate-100",
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

      {/* Panneau (Sidebar) */}
      <div
        ref={panelRef}
        className={[
          "fixed right-0 top-0 bottom-0 h-screen z-[9999]",
          "w-full sm:w-[450px] bg-white border-l",
          "transition-transform duration-300 ease-in-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        style={{
          borderColor: "oklch(0.92 0.01 285)",
          boxShadow: "-4px 0 24px oklch(0.50 0.20 285 / 8%)",
        }}
        aria-hidden={!open}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 bg-white"
            style={{ borderBottom: "1px solid oklch(0.95 0.01 285)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <GeminiIcon size={20} />
                <span className="font-semibold text-sm text-slate-800">Mandat IA</span>
              </div>
              {/* Modèle unique bloqué */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                <span>Llama 3.3 70B</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              {hasMessages && (
                <button
                  onClick={clearChat}
                  title="Nouvelle conversation"
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  aria-label="Effacer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors"
                aria-label="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 flex flex-col"
            style={{ scrollbarWidth: "thin", scrollbarColor: "oklch(0.82 0.04 285) transparent" }}
          >
            {!hasMessages ? (
              <div className="flex flex-col h-full justify-end mt-auto pt-12 pb-2">
                <div className="mb-6 px-1">
                  <h2 className="font-sans font-bold text-2xl tracking-tight leading-snug">
                    <span className="bg-gradient-to-r from-[#1a73e8] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">Bonjour,</span>
                  </h2>
                  <h3 className="font-sans text-xl font-medium text-slate-700 mt-1">
                    Par où devrions-nous commencer ?
                  </h3>
                </div>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left text-xs px-4 py-3.5 rounded-2xl transition-all duration-150 hover:bg-[#f0f4f9] border border-transparent hover:border-black/5 active:scale-[0.99] leading-snug bg-[#f0f4f9]/60 text-slate-700 font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={["flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start items-start"].join(" ")}>
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-1 bg-white border border-slate-100"
                      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <GeminiIcon size={13} />
                    </div>
                  )}
                  {m.role === "user" ? (
                    <div className="max-w-[80%] px-4 py-2.5 text-xs font-medium leading-relaxed rounded-2xl"
                      style={{
                        background: "oklch(0.95 0.01 285)",
                        color: "slate-800",
                        borderBottomRightRadius: "0.25rem",
                      }}>
                      {m.content}
                    </div>
                  ) : (
                    <AssistantBubble message={m} />
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Context Pill (Real-time active DB connection) */}
          <div className="px-3 pb-1 shrink-0">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f6f0ea] border border-[#ecdcc9] text-[11px] text-slate-800 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#f0dec9] flex items-center justify-center text-[#d97706] shrink-0">
                  <Database className="w-3 h-3" />
                </div>
                <span className="font-semibold text-slate-700 tracking-tight text-[10.5px]">Données de « Mandat » connectées (Turso)</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
              </div>
            </div>
          </div>

          {/* Barre d'envoi — style Chrome side-panel / Gemini */}
          <div className="px-3 pb-3 pt-1 shrink-0">
            <div
              className="flex flex-col rounded-3xl px-3 py-2"
              style={{
                background: "#f0f4f9",
                border: "1px solid transparent",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
                }}
                onKeyDown={handleKey}
                placeholder={loading ? "Recherche en cours..." : "Posez une question sur les députés ou scrutins..."}
                disabled={loading}
                rows={1}
                maxLength={500}
                className="flex-1 bg-transparent resize-none outline-none text-xs placeholder:text-slate-500 disabled:opacity-50 leading-relaxed py-1.5 px-1"
                style={{ scrollbarWidth: "none", minHeight: "1.4rem", maxHeight: "6rem" }}
              />

              {/* Bottom controls row inside input container */}
              <div className="flex items-center justify-end pt-1 pb-0.5 shrink-0">
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  style={{
                    background: input.trim() && !loading
                      ? "linear-gradient(135deg, #1a73e8, #1557b0)"
                      : "transparent",
                    color: input.trim() && !loading ? "white" : "#5f6368",
                  }}
                  title="Envoyer"
                >
                  {loading ? (
                    <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
            </div>

            {rateLimited && (
              <p className="text-[9px] text-amber-600 text-center mt-1.5 font-medium">
                Quota atteint — réessayez dans quelques secondes
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
