import { useState } from "react";
import {
  BusFront,
  Clock3,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ShortfallModal from "../../features/shortfall/ShortfallModal.jsx";
import useDashboardSummary from "../../hooks/useDashboardSummary.js";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatCurrency(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>{formatCurrency(payload[0].value)}</span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| OWNER DASHBOARD
|--------------------------------------------------------------------------
|
| This dashboard does NOT render remittance notifications.
|
| Remittance notifications belong inside NotificationBell.jsx.
|
| Full remittance history:
| /owner/remittance-transactions
|
|--------------------------------------------------------------------------
*/

export function Owner() {
  const { loading, error, summary } = useDashboardSummary();
  const [dismissedShortfallId, setDismissedShortfallId] = useState(null);
  const [resolvedShortfallId, setResolvedShortfallId] = useState(null);

  if (loading) {
    return (
      <div className="owner-dashboard flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="animate-spin" size={18} /> Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard">
        <p
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Today's Revenue",
      value: formatCurrency(summary.todaysRevenue),
      trend: "So far today",
      tone: "success",
      icon: TrendingUp,
    },
    {
      label: "Outstanding",
      value: formatCurrency(summary.outstanding),
      trend: `${summary.shortfallCount} shortfall${summary.shortfallCount === 1 ? "" : "s"} pending`,
      tone: "warning",
      icon: Clock3,
    },
    {
      label: "Active Drivers",
      value: String(summary.driverCount),
      trend: "Seen in recent remittances",
      tone: "info",
      icon: Users,
    },
    {
      label: "Vehicles Tracked",
      value: String(summary.vehicleCount),
      trend: "Seen in recent remittances",
      tone: "fleet",
      icon: BusFront,
    },
  ];

  const activeShortfall = summary.shortfallList.find(
    (item) => item.id !== dismissedShortfallId && item.id !== resolvedShortfallId
  );

  return (
    <div className="owner-dashboard">

      {/* ==========================================================
          SUMMARY CARDS
      ========================================================== */}

      <section className="summary-grid" aria-label="Owner summary metrics">
        {summaryCards.map(({ label, value, trend, tone, icon: Icon }) => (
          <div key={label} className={`summary-card ${tone}`}>
            <div className="summary-icon-wrap">
              <Icon size={18} strokeWidth={2} />
            </div>

            <div className="summary-metric">
              <div className="summary-trend">{label}</div>
              <div className="summary-value">{value}</div>
              <div className="summary-label">{trend}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ==========================================================
          SHORTFALL ALERT
      ========================================================== */}

      {activeShortfall && (
        <section className="shortfall-alert mt-6 mb-6 rounded-2xl border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="shortfall-alert-label text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                Shortfall alert
              </p>

              <h3 className="shortfall-alert-title mt-1 text-lg font-bold text-slate-900">
                {activeShortfall.driver_name} has a remittance gap
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setDismissedShortfallId(null)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View details
            </button>
          </div>
        </section>
      )}

      {/* ==========================================================
          WEEKLY REVENUE
      ========================================================== */}

      <section className="revenue-card" aria-labelledby="weekly-revenue-title">
        <div className="card-heading">
          <div>
            <h2 id="weekly-revenue-title">Weekly Revenue</h2>
            <p>Last 7 days</p>
          </div>

          <div className="chart-legend" aria-label="Chart legend">
            <span>
              <i className="legend-dot revenue-dot" />
              Revenue
            </span>
          </div>
        </div>

        <div className="revenue-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={summary.weeklyRevenue}
              margin={{ top: 10, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke="#e8eef4" strokeDasharray="3 4" vertical={false} />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aacc2", fontSize: 12 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aacc2", fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000}k`}
                width={36}
              />

              <Tooltip
                content={<RevenueTooltip />}
                cursor={{ stroke: "#cbd8e5", strokeDasharray: "4 4" }}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#203f68"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#0ca653", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ==========================================================
          SHORTFALL MODAL
      ========================================================== */}

      {activeShortfall && !dismissedShortfallId && (
        <ShortfallModal
          remittance={activeShortfall}
          onClose={() => setDismissedShortfallId(activeShortfall.id)}
          onResolved={() => setResolvedShortfallId(activeShortfall.id)}
        />
      )}

    </div>
  );
}

export default Owner;
