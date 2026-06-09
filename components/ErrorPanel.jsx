export default function ErrorPanel({ error }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm">
      <p className="font-semibold text-red-700">Something went wrong</p>
      <p className="mt-1 text-red-600">{error?.message || String(error)}</p>
    </div>
  );
}
