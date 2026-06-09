export default function MetricCard({ title, value, detail, tone = "blue", icon: Icon }) {
  const tones = {
    blue:   "border-l-brand-600 text-brand-700",
    green:  "border-l-green-600 text-green-700",
    yellow: "border-l-yellow-500 text-yellow-700",
    orange: "border-l-orange-500 text-orange-700",
    red:    "border-l-red-600 text-red-700",
    cyan:   "border-l-sky-500 text-sky-700",
  };

  const iconBg = {
    blue:   "bg-brand-50 text-brand-600",
    green:  "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    orange: "bg-orange-50 text-orange-600",
    red:    "bg-red-50 text-red-600",
    cyan:   "bg-sky-50 text-sky-600",
  };

  const t = tones[tone] || tones.blue;
  const ib = iconBg[tone] || iconBg.blue;

  return (
    <div className={`panel rounded-lg border-l-4 p-5 ${t}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-stone-900">{Number(value || 0).toLocaleString("en-IN")}</p>
          {detail ? <p className="mt-1 text-sm text-stone-500">{detail}</p> : null}
        </div>
        {Icon ? (
          <span className={`rounded-lg p-2 ${ib}`}>
            <Icon size={20} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
