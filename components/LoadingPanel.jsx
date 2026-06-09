export default function LoadingPanel({ label = "Loading live inventory data..." }) {
  return (
    <div className="panel rounded-lg p-8 text-center text-sm font-semibold text-slate-300">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-signal-cyan border-t-transparent" />
      {label}
    </div>
  );
}
