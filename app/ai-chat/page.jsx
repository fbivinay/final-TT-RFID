"use client";

import { useMemo, useRef, useState } from "react";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { generateRetailResponse } from "@/lib/retailAssistant";

const starters = [
  "Give me a full store summary.",
  "How many items are misplaced?",
  "Are there any operational risks?",
  "Which category has the highest stock?",
  "Show me theft and loss report.",
  "What is the rack activity today?",
];

export default function AiChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hello. I am the Texs Mart Retail Operations Assistant.\n\nI analyse live RFID inventory data and provide operational insights. Ask me about misplaced items, theft risk, inventory health, rack activity, category breakdown, or active alerts.",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef(null);

  const lastQuestion = useMemo(
    () => messages.filter((m) => m.role === "user").at(-1)?.text,
    [messages]
  );

  async function send(question = input) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);

    try {
      const answer = await generateRetailResponse(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Unable to fetch data: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Retail Operations Assistant"
        title="AI Chat"
        description="Pattern-matched intelligence engine. Queries live Supabase data — no external AI APIs."
      />

      <section className="panel flex min-h-[70vh] flex-col rounded-lg">
        {/* Header */}
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-signal-cyan/40 bg-signal-cyan/12 p-2 text-signal-cyan">
              <Sparkles size={20} />
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                Inventory Assistant
              </h2>
              <p className="text-sm text-slate-400">
                Powered by deterministic retail analytics · Texs Mart RFID data
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" ? <Avatar icon={Bot} /> : null}
              <div
                className={`max-w-[820px] rounded-lg border px-4 py-3 text-sm leading-7 ${
                  message.role === "user"
                    ? "border-signal-cyan/35 bg-signal-cyan/18 text-white"
                    : "border-white/10 bg-white/[0.055] text-slate-100"
                }`}
                style={{ whiteSpace: "pre-line" }}
              >
                {message.text}
              </div>
              {message.role === "user" ? <Avatar icon={UserRound} /> : null}
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start gap-3">
              <Avatar icon={Bot} />
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-slate-400">
                Querying live inventory data...
              </div>
            </div>
          ) : null}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lastQuestion ? "Ask another inventory question..." : "Ask about inventory, alerts, racks..."
              }
              className="h-12 flex-1 rounded-lg border border-white/10 bg-ink-950/70 px-4 text-sm text-white outline-none focus:border-signal-cyan/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-signal-cyan/40 bg-signal-cyan/16 px-4 text-sm font-black text-signal-cyan disabled:cursor-wait disabled:opacity-50"
            >
              <Send size={17} />
              Send
            </button>
          </form>

          {/* Quick starters */}
          <div className="mt-3 flex flex-wrap gap-2">
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="min-h-9 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-slate-300 hover:border-signal-cyan/35 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Avatar({ icon: Icon }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300">
      <Icon size={17} />
    </span>
  );
}
