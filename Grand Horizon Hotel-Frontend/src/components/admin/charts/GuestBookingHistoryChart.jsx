import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_COLORS } from "./chartColors";
import { formatCurrency } from "../../../utils/format";

const STATUS_COLOR = {
  CONFIRMED: CHART_COLORS.gold,
  PENDING: CHART_COLORS.slate,
  CANCELLED: CHART_COLORS.coral,
};

/** Per-booking spend, oldest to newest — one bar per reservation, shaped as { label, amount, status }. */
export default function GuestBookingHistoryChart({ bookings }) {
  const data = [...bookings]
    .reverse()
    .map((booking) => ({
      label: booking.bookingReference,
      amount: Number(booking.totalAmount) || 0,
      status: booking.status,
    }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(27,48,91,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#1a202788" }} tickLine={false} axisLine={{ stroke: "rgba(27,48,91,0.1)" }} />
        <YAxis
          tick={{ fontSize: 10, fill: "#1a202788" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => (value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`)}
          width={44}
        />
        <Tooltip formatter={(value) => [formatCurrency(value), "Amount"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(27,48,91,0.1)", fontSize: 12 }} />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={STATUS_COLOR[entry.status] || CHART_COLORS.navy} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
