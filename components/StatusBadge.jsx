import { formatStatus } from "@/lib/supabase";

export default function StatusBadge({ status }) {
  const styles = {
    ON_RACK: "border-signal-green/40 bg-signal-green/15 text-signal-green",
    MISPLACED: "border-signal-yellow/40 bg-signal-yellow/15 text-signal-yellow",
    BILLING: "border-signal-cyan/40 bg-signal-cyan/15 text-signal-cyan",
    SOLD: "border-slate-300/30 bg-slate-300/10 text-slate-200",
    STOLEN: "border-signal-red/40 bg-signal-red/15 text-signal-red"
  };

  return (
    <span className={`inline-flex min-w-24 items-center justify-center rounded-full border px-3 py-1 text-xs font-bold ${styles[status] || styles.SOLD}`}>
      {formatStatus(status)}
    </span>
  );
}
