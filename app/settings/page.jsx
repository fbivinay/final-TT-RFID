"use client";

import { Settings } from "lucide-react";
import PageHeader   from "@/components/PageHeader";
import LoadingPanel from "@/components/LoadingPanel";
import ErrorPanel   from "@/components/ErrorPanel";
import { useAuth }  from "@/lib/authContext";

export default function SettingsPage() {
  const { isAdmin, loading, profile } = useAuth();

  if (loading)  return <LoadingPanel />;
  if (!isAdmin) return <ErrorPanel error={{ message: "Access denied. Settings are available to Admins only." }} />;

  return (
    <>
      <PageHeader
        eyebrow="System Configuration"
        title="Settings"
        description="System-level configuration for Trend Trackers Retail Intelligence Platform."
      />

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Current Session */}
        <section className="panel rounded-lg p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings size={18} className="text-brand-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-900">Current Session</h2>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="Logged in as"  value={profile?.full_name || "—"} />
            <Row label="Email"         value={profile?.email || "—"} />
            <Row label="Role"          value={profile?.role || "—"} />
            <Row label="Department"    value={profile?.department || "—"} />
            <Row label="Account Status" value={profile?.status || "—"} />
          </div>
        </section>

        {/* System Info */}
        <section className="panel rounded-lg p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings size={18} className="text-brand-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-900">System Information</h2>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="System"        value="Trend Trackers v1.0" />
            <Row label="Store"         value="Texs Mart" />
            <Row label="Database"      value="Supabase (PostgreSQL)" />
            <Row label="Auth Provider" value="Supabase Auth" />
            <Row label="RFID Protocol" value="EPC Gen 2 UHF" />
            <Row label="Framework"     value="Next.js 15 · React 19" />
          </div>
        </section>

        {/* Supabase Config */}
        <section className="panel rounded-lg p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings size={18} className="text-brand-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-900">Database Tables</h2>
          </div>
          <div className="space-y-3 text-sm">
            {["inventory", "profiles", "racks", "alerts", "events", "movements", "simulation_config"].map((t) => (
              <div key={t} className="flex items-center justify-between border-b border-white/8 pb-2 last:border-0">
                <span className="font-mono text-stone-500">{t}</span>
                <span className="rounded px-2 py-0.5 text-xs font-bold uppercase bg-green-50">Active</span>
              </div>
            ))}
          </div>
        </section>

        {/* Admin Notice */}
        <section className="panel rounded-lg p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings size={18} className="text-yellow-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-900">Admin Notes</h2>
          </div>
          <div className="space-y-3 text-sm text-stone-400">
            <p>To add a new employee with login access, follow these steps:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Go to the Supabase dashboard → Authentication → Users → Invite user</li>
              <li>Set their email and temporary password</li>
              <li>Navigate to Employees page in Trend Trackers → Add Employee</li>
              <li>Enter their Full Name, Email, Role, and Department</li>
              <li>Their profile will be linked when they first sign in</li>
            </ol>
          </div>
        </section>

      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 pb-2 last:border-0">
      <span className="text-stone-400">{label}</span>
      <span className="font-semibold text-stone-900">{value}</span>
    </div>
  );
}
