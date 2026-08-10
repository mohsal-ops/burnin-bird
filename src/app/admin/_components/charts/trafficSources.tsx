"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A855F7", "#EC4899"];

type TrafficRow = {
  name: string;
  value: number;
};

export default function TrafficSourceChart() {
  const [data, setData] = useState<TrafficRow[]>([]);
  const [totalActiveUsers, setTotalActiveUsers] = useState<number>(0);
  const [pending, setPending] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPending(true);
    fetch("/api/analytics", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        // Handle error response from API
        if (data.error || !data.rows || data.rows.length === 0) {
          setError(data.hint || data.message || "No data yet");
          setPending(false);
          return;
        }

        const total = data.rows.reduce(
          (sum: number, row: any) =>
            sum + parseInt(row.metricValues[0].value),
          0
        );

        const formatted: TrafficRow[] = data.rows.map((row: any) => ({
          name: row.dimensionValues[0].value,
          value: parseInt(row.metricValues[0].value),
        }));

        setTotalActiveUsers(total);
        setData(formatted);
        setPending(false);
      })
      .catch((err) => {
        setError("Could not load traffic data");
        setPending(false);
      });
  }, []);

  if (pending) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground animate-pulse">
        Loading traffic data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] gap-2 text-center px-4">
        <p className="text-sm text-muted-foreground">⚠️ {error}</p>
        <p className="text-xs text-muted-foreground">
          Check that <code className="bg-muted px-1 rounded">GA4_PROPERTY_ID</code> in{" "}
          <code className="bg-muted px-1 rounded">.env.local</code> is just the number
          (e.g. <code className="bg-muted px-1 rounded">123456789</code>)
        </p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" minHeight={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={110}
            dataKey="value"
            label={(entry: any) =>
              `${entry.name} ${(Number(entry.percent || 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value} users`, "Active Users"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground mt-2">
        <span className="font-semibold text-foreground">Total active users:</span>{" "}
        {totalActiveUsers.toLocaleString()}
      </p>
    </div>
  );
}