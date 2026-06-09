export default function LoadingPanel({ label = "Loading inventory data..." }) {
  return (
    <div className="panel rounded-lg p-8 text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <p className="text-sm text-stone-500">{label}</p>
    </div>
  );
}
