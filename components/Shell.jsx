"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, BarChart3, Bell, Bot, Boxes, LogOut, Radar, Settings, Users } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { signOut } from "@/lib/auth";

const BASE_NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: BarChart3 },
  { href: "/inventory",  label: "Inventory",  icon: Boxes     },
  { href: "/alerts",     label: "Alerts",     icon: Bell      },
  { href: "/ai-chat",    label: "AI Chat",    icon: Bot       },
];

const ADMIN_NAV = [
  { href: "/employees",  label: "Employees",  icon: Users     },
  { href: "/settings",   label: "Settings",   icon: Settings  },
];

export default function Shell({ children }) {
  const pathname           = usePathname();
  const router             = useRouter();
  const { user, profile, loading, isAdmin } = useAuth();
  const [simActive, setSimActive] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setSimActive(localStorage.getItem("trend-trackers-sim-active") === "true");
  }, []);

  function toggleSimulation() {
    const next = !simActive;
    setSimActive(next);
    localStorage.setItem("trend-trackers-sim-active", String(next));
    window.dispatchEvent(new CustomEvent("trend-trackers-sim-toggle", { detail: next }));
    if (pathname !== "/dashboard" && pathname !== "/") router.push("/dashboard");
  }

  async function handleLogout() {
    try {
      await signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  const navItems = isAdmin ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  // While loading auth, show minimal shell
  if (loading) {
    return (
      <div className="min-h-screen soft-grid flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Radar size={20} className="animate-pulse text-signal-cyan" />
          <span className="text-sm">Loading Trend Trackers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen soft-grid">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-signal-green/40 bg-signal-green/10 text-signal-green shadow-glow">
              <Radar size={22} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-wide text-white">Trend Trackers</span>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Texs Mart RFID Intelligence</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon   = item.icon;
              const active = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                    active
                      ? "border-signal-cyan/40 bg-signal-cyan/16 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Simulation toggle */}
            <button
              onClick={toggleSimulation}
              className={`hidden min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold lg:flex ${
                simActive
                  ? "border-signal-red/40 bg-signal-red/14 text-signal-red"
                  : "border-signal-green/40 bg-signal-green/16 text-signal-green"
              }`}
            >
              <Activity size={16} />
              {simActive ? "Stop Sim" : "Start Sim"}
            </button>

            {/* User info + logout */}
            {user && (
              <div className="hidden items-center gap-3 lg:flex">
                <div className="text-right">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">
                    {profile?.role || "—"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-signal-red/40 hover:text-signal-red"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
