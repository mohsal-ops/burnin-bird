"use client";

import { formatCurrency } from "@/lib/formatters";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type OrderByDayChartProp = {
  data: {
    date: string;
    totalSales: number;
  }[];
};

export default function OrdersByDayChart({ data }: OrderByDayChartProp) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-stone-400 text-sm">
        No sales data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" minHeight={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(tick) => formatCurrency(tick)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), "Revenue"]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        />
        <Line
          type="monotone"
          dot={false}
          name="Total sales"
          dataKey="totalSales"
          stroke="#c85a1e"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}