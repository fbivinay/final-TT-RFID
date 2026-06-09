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
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4">

      <div className="w-full max-w-sm">
        {/* Logo block */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
            <Radar size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Trend Trackers</h1>
            <p className="mt-0.5 text-xs text-stone-400">
              Texs Mart · Retail Inventory Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-7 shadow-card">
          <h2 className="mb-1 text-base font-semibold text-stone-900">Sign in to your account</h2>
          <p className="mb-6 text-sm text-stone-500">
            Enter your Texs Mart credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@texsmart.com"
                className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
            >
              <LogIn size={15} />
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Credentials hint */}
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Demo Credentials
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-stone-500">Admin:</span>
              <span className="font-mono text-brand-600">grofunds6924@gmail.com</span>
            </div>
            <p className="text-right text-stone-400">(your Supabase password)</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          Trend Trackers v1.0 · Texs Mart Retail Management System
        </p>
      </div>
    </div>
  );
}
