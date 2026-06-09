"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LogIn, Radar } from "lucide-react";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080b10] px-4">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.05) 1px,transparent 1px)",
          backgroundSize: "38px 38px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo block */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-signal-green/40 bg-signal-green/10 text-signal-green shadow-glow">
            <Radar size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">Trend Trackers</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              Texs Mart · Retail Inventory Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border border-white/10 p-7"
          style={{
            background: "linear-gradient(135deg,rgba(24,34,46,0.95),rgba(13,18,26,0.92))",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          }}
        >
          <h2 className="mb-1 text-base font-bold text-white">System Sign In</h2>
          <p className="mb-6 text-xs text-slate-400">
            Enter your Texs Mart credentials to access the inventory system.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@texsmart.com"
                className="h-11 w-full rounded-lg border border-white/10 bg-ink-950/70 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-signal-cyan/50 focus:ring-1 focus:ring-signal-cyan/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-white/10 bg-ink-950/70 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-signal-cyan/50 focus:ring-1 focus:ring-signal-cyan/20"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-signal-red" />
                <p className="text-xs text-signal-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-signal-cyan/40 bg-signal-cyan/16 text-sm font-bold text-signal-cyan transition hover:bg-signal-cyan/24 disabled:cursor-wait disabled:opacity-50"
            >
              <LogIn size={16} />
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Credentials hint */}
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Demo Credentials
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Admin:</span>
              <span className="font-mono text-signal-cyan">grofunds6924@gmail.com</span>
            </div>
            <p className="text-right font-mono text-slate-400">(your Supabase password)</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-700">
          Trend Trackers v1.0 · Texs Mart Retail Management System
        </p>
      </div>
    </div>
  );
}
