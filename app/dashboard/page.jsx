"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Boxes, CreditCard, PackageCheck,
  RadioTower, ShieldAlert, ShoppingBag, UserCircle,
} from "lucide-react";
import ChartCard       from "@/components/ChartCard";
import ErrorPanel      from "@/components/ErrorPanel";
import LoadingPanel    from "@/components/LoadingPanel";
import MetricCard      from "@/components/MetricCard";
import PageHeader      from "@/components/PageHeader";
import RecentActivity  from "@/components/RecentActivity";
import { getDashboardData } from "@/lib/data";
import { applyLiveTick, createLiveTick } from "@/lib/liveStore";
import { useAuth }     from "@/lib/authContext";
import { formatStatus } from "@/lib/supabase";

export default function DashboardPage() {
  const { isAdmin, isEmployee, profile } = useAuth();
  const [data,      setData]      = useState(null);
  const [error,     setError]     = useState(null);
  const [simActive, setSimActive] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    getDashboardData().then(setData).catch(setError);
  }, []);

  useEffect(() => {
    setSimActive(localStorage.getItem("trend-trackers-sim-active") === "true");
    const handler = (event) => setSimActive(Boolean(event.detail));
    window.addEventListener("trend-trackers-sim-toggle", handler);
    return () => window.removeEventListener("trend-trackers-sim-toggle", handler);
  }, []);

  useEffect(() => {
    if (!simActive || !data) return undefined;
    const interval = window.setInterval(() => {
      setTickCount((count) => count + 1);
      setData((current) => applyLiveTick(current, createLiveTick(tickCount)));
    }, 1800);
    return () => window.clearInterval(interval);
  }, [data, simActive, tickCount]);

  const statusChart = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.statusCounts).map(([name, value]) => ({
      name: formatStatus(name),
      value,
    }));
  }, [data]);

  if (error) return <ErrorPanel error={error} />;
  if (!data)  return <LoadingPanel />;

  // ── Employee view ──────────────────────────────────────────────────────────
  if (isEmployee) {
    return <EmployeeDashboard profile={profile} data={data} simActive={simActive} tickCount={tickCount} />;
  }

  // ── Admin / full view ──────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        eyebrow="Executive Dashboard"
        title="Smart RFID Inventory Intelligence"
        description="Live operational visibility across inventory health, rack discipline, theft signals, and retail movement for Texs Mart."
      />

      <LiveStoreStrip active={simActive} events={tickCount} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Total Inventory" value={data.totalInventory}          detail="items in database"      tone="cyan"   icon={Boxes}        />
        <MetricCard title="ON_RACK"         value={data.statusCounts.ON_RACK}    detail="correctly positioned"   tone="green"  icon={PackageCheck} />
        <MetricCard title="MISPLACED"       value={data.statusCounts.MISPLACED}  detail="need repositioning"     tone="yellow" icon={AlertTriangle} />
        <MetricCard title="STOLEN"          value={data.statusCounts.STOLEN}     detail="theft risk count"       tone="red"    icon={ShieldAlert}  />
        <MetricCard title="BILLING"         value={data.statusCounts.BILLING}    detail="at checkout"            tone="orange" icon={CreditCard}   />
        <MetricCard title="SOLD"            value={data.statusCounts.SOLD}       detail="completed sales"        tone="cyan"   icon={ShoppingBag}  />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Inventory by Category"           data={data.categories} />
        <ChartCard title="Inventory by Section"            data={data.sections}   />
        <ChartCard title="Inventory Status Distribution"   data={statusChart} type="pie" />
        <ChartCard title="Top Brands"                      data={data.brands}     />
      </div>

      <div className="mt-6">
        <RecentActivity events={data.recentEvents} alerts={data.alerts} />
      </div>
    </>
  );
}

// ── Employee Dashboard ─────────────────────────────────────────────────────────

function EmployeeDashboard({ profile, data, simActive, tickCount }) {
  const department = profile?.department || "—";
  const sc = data?.statusCounts || {};

  return (
    <>
      <PageHeader
        eyebrow={`Employee · ${department}`}
        title="My Work Dashboard"
        description="Your assigned inventory area, active tasks, and current RFID status."
      />

      <LiveStoreStrip active={simActive} events={tickCount} />

      {/* Employee identity strip */}
      <div className="panel mb-6 flex items-center gap-4 rounded-lg p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200">
          <UserCircle size={26} />
        </span>
        <div>
          <p className="font-bold text-stone-900">{profile?.full_name || "Staff Member"}</p>
          <p className="text-sm text-stone-400">
            {department} · Status:{" "}
            <span className="font-semibold text-green-600">{profile?.status || "ACTIVE"}</span>
          </p>
        </div>
      </div>

      {/* Employee KPIs — no revenue, no stolen aggregates */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="On Rack"     value={sc.ON_RACK   || 0} detail="items correctly placed"  tone="green"  icon={PackageCheck}  />
        <MetricCard title="Misplaced"   value={sc.MISPLACED || 0} detail="items needing attention" tone="yellow" icon={AlertTriangle} />
        <MetricCard title="At Billing"  value={sc.BILLING   || 0} detail="items at checkout"       tone="orange" icon={CreditCard}    />
        <MetricCard title="Total Items" value={data?.totalInventory || 0} detail="in your area"    tone="cyan"   icon={Boxes}         />
      </div>

      {/* Recent activity */}
      <div className="mt-6">
        <RecentActivity events={data?.recentEvents} alerts={data?.alerts} />
      </div>
    </>
  );
}

// ── Live store strip ───────────────────────────────────────────────────────────

function LiveStoreStrip({ active, events }) {
  return (
    <section
      className={`mb-6 rounded-lg border p-4 ${
        active ? "border-green-200 bg-green-50" : "border-stone-200 bg-stone-50"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-lg border p-2 ${
              active ? "border-green-200 text-green-600" : "border-stone-300 text-stone-400"
            }`}
          >
            <RadioTower size={18} />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-stone-900">
              {active ? "Live Store Simulation Running" : "Live Store Simulation Ready"}
            </p>
            <p className="text-sm text-stone-400">
              {active
                ? "RFID reads are flowing automatically across racks, billing, exits, and alerts."
                : "Press Start Sim in the header to begin automatic real-world store activity."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
          <span>{events.toLocaleString("en-IN")} live events</span>
          <span className={active ? "text-green-600" : "text-stone-400"}>
            {active ? "Active" : "Idle"}
          </span>
        </div>
      </div>
    </section>
  );
}
