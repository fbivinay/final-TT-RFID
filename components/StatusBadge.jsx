import { formatStatus } from "@/lib/supabase";

export default function StatusBadge({ status }) {
  const styles = {
    ON_RACK:   "bg-green-50  text-green-700  border border-green-200",
    MISPLACED: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    BILLING:   "bg-sky-50    text-sky-700    border border-sky-200",
    SOLD:      "bg-stone-100 text-stone-600  border border-stone-200",
    STOLEN:    "bg-red-50    text-red-700    border border-red-200",
  };

  return (
    <span className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-0.5 text-xs font-medium ${styles[status] || styles.SOLD}`}>
      {formatStatus(status)}
    </span>
  );
}
