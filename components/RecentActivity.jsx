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
        <h2 className="text-sm font-semibold text-stone-700">Recent Activity</h2>
        <Clock size={16} className="text-stone-400" />
      </div>
      <div className="space-y-3">
        {rows.slice(0, 10).map((row, index) => (
          <div key={row.id || `${row.rfid_tag_id}-${index}`} className="flex items-start gap-3 border-b border-stone-100 pb-3 last:border-b-0">
            <span className="mt-0.5 rounded-md bg-brand-50 p-1.5 text-brand-600">
              <RadioTower size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-stone-600">
                  {row.event_type || row.type || "SCAN"}
                </span>
                <span className="text-xs text-stone-400">{formatTime(row.created_at || row.event_time)}</span>
              </div>
              <p className="mt-0.5 truncate text-sm text-stone-700">
                {row.description || row.message || row.product_name || row.rfid_tag_id || "Inventory event recorded"}
              </p>
            </div>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-stone-400">No recent events available.</p> : null}
      </div>
    </section>
  );
}

function formatTime(value) {
  if (!value) return "Live";
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
