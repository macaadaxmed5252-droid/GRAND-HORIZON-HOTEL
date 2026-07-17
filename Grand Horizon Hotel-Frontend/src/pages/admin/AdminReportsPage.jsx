import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchRevenueReport, fetchOccupancyReport, REPORT_RANGES } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { SkeletonChart } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import RevenueTrendChart from "../../components/admin/charts/RevenueTrendChart";
import OccupancyTrendChart from "../../components/admin/charts/OccupancyTrendChart";
import { formatCurrency, titleCase } from "../../utils/format";

const RANGE_LABELS = { day: "Last 30 Days", week: "Last 12 Weeks", month: "Last 12 Months" };

function RangeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-navy-950/10 bg-white p-1">
      {REPORT_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ease-in-out ${
            value === range ? "bg-navy-800 text-white shadow-luxury-sm" : "text-navy-950/50 hover:text-navy-950"
          }`}
        >
          {titleCase(range)}
        </button>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const { apiError } = useToast();
  const [range, setRange] = useState("day");
  const [revenue, setRevenue] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [status, setStatus] = useState("loading");

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([fetchRevenueReport(range), fetchOccupancyReport(range)])
      .then(([revenueData, occupancyData]) => {
        setRevenue(revenueData);
        setOccupancy(occupancyData);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load reports", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const totalRevenue = useMemo(
    () => revenue.reduce((sum, point) => sum + Number(point.revenue || 0), 0),
    [revenue],
  );
  const averageOccupancy = useMemo(() => {
    if (occupancy.length === 0) return 0;
    return occupancy.reduce((sum, point) => sum + Number(point.occupancyRate || 0), 0) / occupancy.length;
  }, [occupancy]);

  if (status === "error") {
    return <ErrorState message="We couldn't load the reports data." onRetry={load} />;
  }

  const loading = status === "loading";

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-navy-950/50">
          Showing <span className="font-medium text-navy-950">{RANGE_LABELS[range]}</span>
        </p>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <div className="card-surface p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-navy-950">Revenue Trend</h2>
            <p className="mt-1 text-sm text-navy-950/50">Non-cancelled bookings, grouped by when they were made.</p>
          </div>
          {!loading && (
            <p className="font-display text-2xl font-semibold text-gold-600">{formatCurrency(totalRevenue)}</p>
          )}
        </div>
        <div className="mt-4">{loading ? <SkeletonChart /> : <RevenueTrendChart data={revenue} />}</div>
      </div>

      <div className="card-surface p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-navy-950">Occupancy Trend</h2>
            <p className="mt-1 text-sm text-navy-950/50">
              {range === "day" ? "Daily" : "Average daily"} occupancy rate across the period.
            </p>
          </div>
          {!loading && (
            <p className="font-display text-2xl font-semibold text-navy-800">{averageOccupancy.toFixed(1)}%</p>
          )}
        </div>
        <div className="mt-4">{loading ? <SkeletonChart /> : <OccupancyTrendChart data={occupancy} />}</div>
      </div>
    </div>
  );
}
