import { Clock, RadioTower } from "lucide-react";

export default function RecentActivity({ events = [], alerts = [] }) {
  const rows = events.length
    ? events
    : alerts.map((alert) => ({
        ...alert,
        event_type: alert.alert_type || alert.type || "ALERT",
        description: alert.message || alert.product_name || alert.rfid_tag_id
      }));

  return (
    <section className="panel rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Recent Activity</h2>
        <Clock size={17} className="text-slate-500" />
      </div>
      <div className="space-y-3">
        {rows.slice(0, 10).map((row, index) => (
          <div key={row.id || `${row.rfid_tag_id}-${index}`} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-b-0">
            <span className="mt-1 rounded-md border border-signal-cyan/30 bg-signal-cyan/12 p-1.5 text-signal-cyan">
              <RadioTower size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-black uppercase text-white">
                  {row.event_type || row.type || "SCAN"}
                </span>
                <span className="text-xs text-slate-500">{formatTime(row.created_at || row.event_time)}</span>
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-200">
                {row.description || row.message || row.product_name || row.rfid_tag_id || "Inventory event recorded"}
              </p>
            </div>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-slate-500">No recent events are available.</p> : null}
      </div>
    </section>
  );
}

function formatTime(value) {
  if (!value) return "Live";
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
