import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CATEGORICAL_PALETTE } from "./chartColors";
import { titleCase } from "../../../utils/format";
import EmptyState from "../../common/EmptyState";

/** Donut chart of room counts grouped by RoomType. */
export default function RoomTypeDonut({ distribution }) {
  const entries = Object.entries(distribution || {});
  const data = entries.map(([type, count]) => ({ name: titleCase(type), value: count }));

  if (data.length === 0) {
    return <EmptyState title="No rooms yet" description="Add rooms from the Rooms page to see their type distribution here." />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} cornerRadius={6}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} room${value === 1 ? "" : "s"}`, name]}
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(27,48,91,0.1)", fontSize: 13 }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#1a2027aa" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
