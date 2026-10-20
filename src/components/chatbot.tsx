import { useEffect, useRef, useState, type FormEvent } from "react";
import { ExternalLink, MessageCircle, Phone, Send, X } from "lucide-react";
import { INFO } from "@/data/menu";
import { FALLBACK, localAnswer } from "@/lib/chat-local";
import { useOrderConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const HELLO: Msg = {
  role: "assistant",
  content: `Hi! Ask me anything about Village Grille: the menu, hours, location or ordering. If I can't help, I'll point you to ${INFO.phone}.`,
};
const SUGGESTIONS = ["What are your hours?", "Vegetarian options?", "Do you deliver?", "What's popular?"];

async function ask(history: Msg[], ordersHere: boolean): Promise<string> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(1) }), // drop the greeting
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (r.ok) {
      const { reply } = await r.json();
      if (typeof reply === "string" && reply.trim()) return reply;
    }
  } catch {
    /* fall through to the built-in answers */
  }
  return localAnswer(history[history.length - 1].content, ordersHere);
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const { mode } = useOrderConfig();

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy, open]);

  const send = async (raw: string) => {
    const content = raw.trim().slice(0, 500);
    if (!content || busy) return;
    const next = [...msgs, { role: "user", content } as Msg];
    setMsgs(next);
    setText("");
    setBusy(true);
    const reply = await ask(next, mode !== "link");
    setMsgs([...next, { role: "assistant", content: reply }]);
    setBusy(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Ask a question"}
        className="fixed bottom-5 right-5 z-[45] flex h-14 items-center gap-2 rounded-full bg-brand px-5 font-bold text-white shadow-2xl transition hover:bg-brand-dark active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask us anything"}</span>
      </button>

      <div
        aria-hidden={!open}
        className={cn(
          "fixed bottom-24 right-5 z-[45] flex h-[min(34rem,calc(100vh-8rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl transition-[opacity,transform,visibility] duration-300",
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0"
        )}
      >
        <div className="flex flex-none items-center justify-between bg-brand px-5 py-4 text-white">
          <div>
            <p className="font-extrabold">Ask Village Grille</p>
            <p className="text-xs text-white/80">Instant answers about our menu &amp; hours</p>
          </div>
          <a href={INFO.phoneHref} aria-label={`Call ${INFO.phone}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25">
            <Phone className="h-4 w-4" />
          </a>
        </div>

        <div data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
              <p
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-zinc-100 text-zinc-900"
                )}
              >
                {m.content}
              </p>
              {m.role === "assistant" && m.content.includes("order.yourmenu.com") && (
                <a
                  href={INFO.orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  Order online <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {m.role === "assistant" && (m.content.includes(INFO.phone) || m.content === FALLBACK) && i > 0 && (
                <a
                  href={INFO.phoneHref}
                  className="inline-flex items-center gap-2 rounded-full border border-brand px-4 py-2 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
                >
                  <Phone className="h-4 w-4" /> Call {INFO.phone}
                </a>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex w-16 justify-center gap-1 rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3" aria-label="Typing">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          )}
          {msgs.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-brand hover:text-brand">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={end} />
        </div>

        <form onSubmit={submit} className="flex flex-none gap-2 border-t border-black/10 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Ask a question…"
            className="h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-zinc-50 px-4 text-sm outline-none focus:border-brand"
          />
          <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}
