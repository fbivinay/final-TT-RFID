"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const palette = ["#74d8ff", "#8df589", "#ffd166", "#ff9b6a", "#ff6b7a", "#c7d2fe", "#67e8f9", "#f9a8d4"];

export default function ChartCard({ title, data, type = "bar" }) {
  return (
    <section className="panel min-h-80 rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">{title}</h2>
        <span className="text-xs font-semibold text-slate-500">{data?.length || 0} groups</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={3}>
                {(data || []).map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#f8fafc" }} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 24 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-18} textAnchor="end" height={58} interval={0} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(116, 216, 255, 0.08)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {(data || []).map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const tooltipStyle = {
  background: "#111923",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: 8,
  color: "#f8fafc"
};
