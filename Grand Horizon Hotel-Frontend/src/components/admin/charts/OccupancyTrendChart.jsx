import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./chartColors";

/** Bar chart of occupancy rate over time, points shaped as { label, occupancyRate }. */
export default function OccupancyTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(27,48,91,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#1a202788" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(27,48,91,0.1)" }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#1a202788" }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          width={40}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Occupancy"]}
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(27,48,91,0.1)", fontSize: 13 }}
        />
        <Bar dataKey="occupancyRate" fill={CHART_COLORS.navy} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
