"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

const palette = ["#2563eb", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#7c3aed", "#0284c7", "#db2777"];

export default function ChartCard({ title, data, type = "bar" }) {
  return (
    <section className="panel min-h-80 rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
        <span className="text-xs text-stone-400">{data?.length || 0} groups</span>
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
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 24 }}>
              <CartesianGrid stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="name" stroke="#a8a29e" tick={{ fontSize: 11 }} angle={-18} textAnchor="end" height={58} interval={0} />
              <YAxis stroke="#a8a29e" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
  background: "#ffffff",
  border: "1px solid #e7e5e4",
  borderRadius: 8,
  color: "#1c1917",
  boxShadow: "0 4px 12px rgba(0,0,0,0.10)"
};
