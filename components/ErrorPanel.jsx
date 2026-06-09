export default function ErrorPanel({ error }) {
  return (
    <div className="rounded-lg border border-signal-red/35 bg-signal-red/10 p-5 text-sm text-red-100">
      <p className="font-bold text-signal-red">Supabase query failed</p>
      <p className="mt-2 text-slate-200">{error?.message || String(error)}</p>
    </div>
  );
}
