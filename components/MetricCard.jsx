export default function MetricCard({ title, value, detail, tone = "cyan", icon: Icon }) {
  const tones = {
    cyan: "text-signal-cyan border-signal-cyan/30",
    green: "text-signal-green border-signal-green/30",
    yellow: "text-signal-yellow border-signal-yellow/30",
    orange: "text-signal-orange border-signal-orange/30",
    red: "text-signal-red border-signal-red/30"
  };

  return (
    <div className={`panel rounded-lg border-l-4 p-5 ${tones[tone] || tones.cyan}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black text-white">{Number(value || 0).toLocaleString("en-IN")}</p>
          {detail ? <p className="mt-1 text-sm text-slate-300">{detail}</p> : null}
        </div>
        {Icon ? (
          <span className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
            <Icon size={20} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
