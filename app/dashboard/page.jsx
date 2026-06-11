"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Boxes, CreditCard, PackageCheck,
  RadioTower, ShieldAlert, ShoppingBag, UserCircle, X,
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
import { formatStatus, supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { isAdmin, isEmployee, profile } = useAuth();
  const [data,      setData]      = useState(null);
  const [error,     setError]     = useState(null);
  const [simActive, setSimActive] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [modal,     setModal]     = useState(null); // { status, title }

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

  function openModal(status, title) {
    if (!status) return;
    setModal({ status, title });
  }

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
        <MetricCard title="Total Inventory" value={data.totalInventory}         detail="items in database"     tone="cyan"   icon={Boxes}        onClick={() => openModal("ALL",      "All Inventory")} />
        <MetricCard title="ON_RACK"         value={data.statusCounts.ON_RACK}   detail="correctly positioned"  tone="green"  icon={PackageCheck} onClick={() => openModal("ON_RACK",  "On Rack Items")} />
        <MetricCard title="MISPLACED"       value={data.statusCounts.MISPLACED} detail="need repositioning"    tone="yellow" icon={AlertTriangle} onClick={() => openModal("MISPLACED","Misplaced Items")} />
        <MetricCard title="STOLEN"          value={data.statusCounts.STOLEN}    detail="theft risk count"      tone="red"    icon={ShieldAlert}  onClick={() => openModal("STOLEN",   "Stolen / Flagged Items")} />
        <MetricCard title="BILLING"         value={data.statusCounts.BILLING}   detail="at checkout"           tone="orange" icon={CreditCard}   onClick={() => openModal("BILLING",  "Items at Billing")} />
        <MetricCard title="SOLD"            value={data.statusCounts.SOLD}      detail="completed sales"       tone="cyan"   icon={ShoppingBag}  onClick={() => openModal("SOLD",     "Sold Items")} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Inventory by Category"          data={data.categories} />
        <ChartCard title="Inventory by Section"           data={data.sections}   />
        <ChartCard title="Inventory Status Distribution"  data={statusChart} type="pie" />
        <ChartCard title="Top Brands"                     data={data.brands}     />
      </div>

      <div className="mt-6">
        <RecentActivity events={data.recentEvents} alerts={data.alerts} />
      </div>

      {modal && (
        <ItemModal
          status={modal.status}
          title={modal.title}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Item Modal ─────────────────────────────────────────────────────────────────

function ItemModal({ status, title, onClose }) {
  const [items,       setItems]       = useState([]);
  const [sectionRack, setSectionRack] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("inventory")
          .select("rfid_tag_id, product_name, category, current_rack, section, status")
          .order("current_rack", { ascending: true })
          .limit(1000);

        if (status !== "ALL") query = query.eq("status", status);

        const { data, error: err } = await query;
        if (err) throw err;
        setItems(data || []);

        // For misplaced items, build a section -> most-common rack map
        // from correctly-placed (ON_RACK) items so we can show the
        // item's "home" rack letter instead of its section name.
        if (status === "MISPLACED") {
          const { data: onRackData } = await supabase
            .from("inventory")
            .select("section, current_rack")
            .eq("status", "ON_RACK")
            .limit(5000);

          const tally = {};
          (onRackData || []).forEach((row) => {
            if (!row.section || !row.current_rack) return;
            tally[row.section] = tally[row.section] || {};
            tally[row.section][row.current_rack] = (tally[row.section][row.current_rack] || 0) + 1;
          });

          const map = {};
          Object.entries(tally).forEach(([section, racks]) => {
            const top = Object.entries(racks).sort((a, b) => b[1] - a[1])[0];
            if (top) map[section] = top[0];
          });
          setSectionRack(map);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex w-full max-w-3xl flex-col rounded-xl border border-stone-200 bg-white shadow-2xl" style={{ maxHeight: "85vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h3 className="font-semibold text-stone-900">{title}</h3>
            {!loading && <p className="text-xs text-stone-400">{items.length} items</p>}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-6"><LoadingPanel label="Fetching items..." /></div>}
          {error   && <div className="p-6"><ErrorPanel error={{ message: error }} /></div>}
          {!loading && !error && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 text-xs uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">RFID</th>
                  {status === "MISPLACED" ? (
                    <>
                      <th className="px-4 py-3 text-left">Original Rack</th>
                      <th className="px-4 py-3 text-left">Misplaced Rack</th>
                    </>
                  ) : (
                    <th className="px-4 py-3 text-left">Rack</th>
                  )}
                  {status === "ALL" && <th className="px-4 py-3 text-left">Status</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.rfid_tag_id} className="border-b border-stone-100 odd:bg-stone-50/50 hover:bg-brand-50">
                    <td className="px-4 py-3 text-stone-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{item.product_name || "—"}</td>
                    <td className="px-4 py-3 text-stone-500">{item.category || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{item.rfid_tag_id}</td>
                    {status === "MISPLACED" ? (
                      <>
                        <td className="px-4 py-3 font-semibold text-green-700">{sectionRack[item.section] || item.section || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-red-700">{item.current_rack || "—"}</td>
                      </>
                    ) : (
                      <td className="px-4 py-3 text-stone-600">{item.current_rack || "—"}</td>
                    )}
                    {status === "ALL" && (
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                          item.status === "ON_RACK"   ? "bg-green-50 text-green-700"  :
                          item.status === "MISPLACED" ? "bg-yellow-50 text-yellow-700":
                          item.status === "STOLEN"    ? "bg-red-50 text-red-700"      :
                          item.status === "BILLING"   ? "bg-orange-50 text-orange-700":
                          "bg-stone-100 text-stone-500"
                        }`}>{item.status}</span>
                      </td>
                    )}
                  </tr>
                ))}
                {!items.length && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-400">No items found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="On Rack"     value={sc.ON_RACK   || 0} detail="items correctly placed"  tone="green"  icon={PackageCheck}  />
        <MetricCard title="Misplaced"   value={sc.MISPLACED || 0} detail="items needing attention" tone="yellow" icon={AlertTriangle} />
        <MetricCard title="At Billing"  value={sc.BILLING   || 0} detail="items at checkout"       tone="orange" icon={CreditCard}    />
        <MetricCard title="Total Items" value={data?.totalInventory || 0} detail="in your area"    tone="cyan"   icon={Boxes}         />
      </div>

      <div className="mt-6">
        <RecentActivity events={data?.recentEvents} alerts={data?.alerts} />
      </div>
    </>
  );
}

// ── Live store strip ───────────────────────────────────────────────────────────

function LiveStoreStrip({ active, events }) {
  return (
    <section className={`mb-6 rounded-lg border p-4 ${active ? "border-green-200 bg-green-50" : "border-stone-200 bg-stone-50"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded-lg border p-2 ${active ? "border-green-200 text-green-600" : "border-stone-300 text-stone-400"}`}>
            <RadioTower size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {active ? "Live Store Simulation Running" : "Live Store Simulation Ready"}
            </p>
            <p className="text-sm text-stone-400">
              {active
                ? "RFID reads are flowing automatically across racks, billing, exits, and alerts."
                : "Press Start Sim in the header to begin automatic real-world store activity."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
          <span>{events.toLocaleString("en-IN")} live events</span>
          <span className={active ? "text-green-600" : "text-stone-400"}>{active ? "Active" : "Idle"}</span>
        </div>
      </div>
    </section>
  );
}
