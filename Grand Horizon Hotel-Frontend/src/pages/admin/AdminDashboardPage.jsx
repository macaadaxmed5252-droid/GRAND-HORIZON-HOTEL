import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDashboardSummary } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import StatCard from "../../components/dashboard/StatCard";
import { SkeletonStatCard, SkeletonChart } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import OccupancyGauge from "../../components/admin/charts/OccupancyGauge";
import RoomTypeDonut from "../../components/admin/charts/RoomTypeDonut";
import TodaysReservationsPanel from "../../components/admin/TodaysReservationsPanel";
import { formatCurrency } from "../../utils/format";

export default function AdminDashboardPage() {
  const { apiError } = useToast();
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    fetchDashboardSummary()
      .then((data) => {
        setSummary(data);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load dashboard", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "error") {
    return <ErrorState message="We couldn't load the dashboard summary." onRetry={load} />;
  }

  const loading = status === "loading";

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Bookings Today"
              value={summary.totalBookingsToday}
              accent="gold"
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
            <StatCard
              label="Rooms Available"
              value={`${summary.roomsAvailable} / ${summary.totalRooms}`}
              accent="available"
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />}
            />
            <StatCard
              label="Month-to-Date Revenue"
              value={formatCurrency(summary.monthToDateRevenue)}
              accent="navy"
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8V6m0 10v2m0-12a9 9 0 100 18 9 9 0 000-18z" />}
            />
            <StatCard
              label="Total Guests"
              value={summary.totalGuests}
              accent="occupied"
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-6.65" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <SkeletonStatCard />
        ) : (
          <StatCard
            label="Check-Ins Today"
            value={summary.checkInsToday}
            accent="available"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14M4 4v16" />}
          />
        )}
        {loading ? (
          <SkeletonStatCard />
        ) : (
          <StatCard
            label="Check-Outs Today"
            value={summary.checkOutsToday}
            accent="occupied"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M13 8l4 4m0 0l-4 4m4-4H3M20 4v16" />}
          />
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="font-display text-lg font-semibold text-navy-950">Occupancy Rate</h2>
          <p className="mt-1 text-sm text-navy-950/50">Share of rooms occupied as of today.</p>
          {loading ? <SkeletonChart height="h-56" /> : <OccupancyGauge value={summary.occupancyRateToday} />}
        </div>

        <div className="card-surface p-6">
          <h2 className="font-display text-lg font-semibold text-navy-950">Room Type Distribution</h2>
          <p className="mt-1 text-sm text-navy-950/50">Inventory breakdown across all room types.</p>
          <div className="mt-4">
            {loading ? <SkeletonChart height="h-56" /> : <RoomTypeDonut distribution={summary.roomTypeDistribution} />}
          </div>
        </div>
      </div>

      <TodaysReservationsPanel />
    </div>
  );
}
