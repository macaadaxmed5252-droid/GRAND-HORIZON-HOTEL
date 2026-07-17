import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./chartColors";
import { formatCurrency } from "../../../utils/format";

/** Area/line revenue trend, points shaped as { label, revenue }. */
export default function RevenueTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.gold} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(value) => (value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`)}
          width={52}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value), "Revenue"]}
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(27,48,91,0.1)", fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS.gold}
          strokeWidth={2.5}
          fill="url(#revenueFill)"
          activeDot={{ r: 5, fill: CHART_COLORS.gold, stroke: "white", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
