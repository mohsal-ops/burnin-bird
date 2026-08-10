"use client";

import { formatCurrency } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type ProductRevenueChartProp = {
  data: {
    name: string;
    revenue: number;
  }[];
};

const COLORS = [
  "#c85a1e",
  "#1a6b3c",
  "#1d4ed8",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
];

export default function ProductRevenueByDayChart({ data }: ProductRevenueChartProp) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-stone-400 text-sm">
        No product revenue data yet
      </div>
    );
  }

  // Only show top 8 to avoid clutter
  const topData = data.slice(0, 8);

  return (
    <ResponsiveContainer width="100%" minHeight={300}>
      <BarChart data={topData} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(tick) => formatCurrency(tick)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), "Revenue"]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {topData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}