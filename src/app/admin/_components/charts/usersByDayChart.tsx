"use client";

import { formatNumber } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type UsersByDayChartProp = {
  data: {
    date: string;
    totalUsers: number;
  }[];
};

export default function UserssByDayChart({ data }: UsersByDayChartProp) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-stone-400 text-sm">
        No customer data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" minHeight={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(tick) => formatNumber(tick)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "#f9fafb" }}
          formatter={(value) => [formatNumber(value as number), "New customers"]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        />
        <Bar
          name="New users"
          dataKey="totalUsers"
          fill="#1a6b3c"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}