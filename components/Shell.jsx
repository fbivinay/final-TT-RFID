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

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-400">
          <Radar size={20} className="animate-pulse text-brand-600" />
          <span className="text-sm text-stone-500">Loading Trend Trackers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Radar size={18} />
            </span>
            <span>
              <span className="block text-base font-semibold text-stone-900 leading-tight">Trend Trackers</span>
              <span className="text-[11px] text-stone-400 tracking-wide">Texs Mart · RFID Intelligence</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon   = item.icon;
              const active = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-700 border border-brand-200"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-transparent"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSimulation}
              className={`hidden min-h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium lg:flex transition-colors ${
                simActive
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              <Activity size={15} />
              {simActive ? "Stop Simulation" : "Start Simulation"}
            </button>

            {user && (
              <div className="hidden items-center gap-3 lg:flex">
                <div className="text-right">
                  <p className="text-xs font-semibold text-stone-800 leading-tight">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-[10px] text-stone-400 capitalize">
                    {profile?.role || "—"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={14} />
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
