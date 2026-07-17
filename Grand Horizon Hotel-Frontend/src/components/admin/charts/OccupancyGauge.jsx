import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { CHART_COLORS } from "./chartColors";

/** Single-value radial gauge for today's occupancy rate (0-100%). */
export default function OccupancyGauge({ value }) {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  const data = [{ name: "Occupancy", value: clamped, fill: CHART_COLORS.gold }];

  return (
    <div className="relative flex h-56 w-full items-center justify-center">
      <RadialBarChart
        width={220}
        height={220}
        cx="50%"
        cy="50%"
        innerRadius="72%"
        outerRadius="100%"
        barSize={16}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: "rgba(27,48,91,0.06)" }} dataKey="value" cornerRadius={8} angleAxisId={0} />
      </RadialBarChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold text-navy-950">{clamped.toFixed(0)}%</span>
        <span className="text-xs font-medium uppercase tracking-wider text-navy-950/40">Occupied Today</span>
      </div>
    </div>
  );
}
