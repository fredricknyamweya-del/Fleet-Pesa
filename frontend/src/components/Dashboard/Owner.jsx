import { useEffect, useState } from "react";
import {
  BusFront,
  Clock3,
  TrendingUp,
  Users,
} from "lucide-react";

import * as api from "../../lib/api.js";

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

/*
|--------------------------------------------------------------------------
| WEEKLY REVENUE
|--------------------------------------------------------------------------
*/

const weeklyRevenue = [
  { day: "Mon", revenue: 38000 },
  { day: "Tue", revenue: 45000 },
  { day: "Wed", revenue: 42000 },
  { day: "Thu", revenue: 39000 },
  { day: "Fri", revenue: 52000 },
  { day: "Sat", revenue: 62000 },
  { day: "Sun", revenue: 48100 },
];

/*
|--------------------------------------------------------------------------
| SAMPLE SHORTFALL
|--------------------------------------------------------------------------
*/


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

      <span>
        {formatCurrency(payload[0].value)}
      </span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SUMMARY CARDS
|--------------------------------------------------------------------------
*/

const summaryCards = [
  {
    label: "Today's Revenue",
    value: "KES 14,100",
    trend: "+ 14% vs yesterday",
    tone: "success",
    icon: TrendingUp,
  },
  {
    label: "Outstanding",
    value: "KES 9,900",
    trend: "4 drivers pending",
    tone: "warning",
    icon: Clock3,
  },
  {
    label: "Active Drivers",
    value: "6 / 8",
    trend: "1 offline today",
    tone: "info",
    icon: Users,
  },
  {
    label: "Vehicles Tracked",
    value: "8 / 10",
    trend: "2 parked today",
    tone: "fleet",
    icon: BusFront,
  },
];

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
  const [showShortfall, setShowShortfall] = useState(false);
  const [shortfall, setShortfall] = useState(null);
  const [isLoadingShortfall, setIsLoadingShortfall] = useState(true);
  const [shortfallError, setShortfallError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadShortfall() {
      try {
        setIsLoadingShortfall(true);
        setShortfallError("");

        const response = await api.listRemittances({
          status: "short",
        });

        const remittances =
          Array.isArray(response)
            ? response
            : response?.remittances || [];

        const unresolved = remittances.find(
          (item) =>
            item.status === "short" &&
            !item.resolved
        );

        if (isMounted) {
          setShortfall(unresolved || null);
        }
      } catch (error) {
        if (isMounted) {
          setShortfallError(
            error?.message ||
              "Unable to load remittance shortfalls."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingShortfall(false);
        }
      }
    }

    loadShortfall();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasShortfall = Boolean(shortfall);

  return (
    <div className="owner-dashboard">

      {/* ==========================================================
          SUMMARY CARDS
      ========================================================== */}

      <section
        className="summary-grid"
        aria-label="Owner summary metrics"
      >
        {summaryCards.map(
          ({
            label,
            value,
            trend,
            tone,
            icon: Icon,
          }) => (
            <div
              key={label}
              className={`summary-card ${tone}`}
            >
              <div className="summary-icon-wrap">
                <Icon
                  size={18}
                  strokeWidth={2}
                />
              </div>

              <div className="summary-metric">
                <div className="summary-trend">
                  {label}
                </div>

                <div className="summary-value">
                  {value}
                </div>

                <div className="summary-label">
                  {trend}
                </div>
              </div>
            </div>
          )
        )}
      </section>

      {/* ==========================================================
          SHORTFALL ALERT
      ========================================================== */}

      {isLoadingShortfall && (
        <section className="mt-6 mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Loading remittance shortfalls...
          </p>
        </section>
      )}

      {shortfallError && (
        <section className="mt-6 mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            {shortfallError}
          </p>
        </section>
      )}

      {hasShortfall && shortfall && (
        <section className="shortfall-alert mt-6 mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="shortfall-alert-label text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                Shortfall alert
              </p>

              <h3 className="shortfall-alert-title mt-1 text-lg font-bold text-slate-900">
                Remittance #{shortfall.id} has a shortfall
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Expected KES{" "}
                {Number(shortfall.expected_amount || 0).toLocaleString("en-KE")}
                {" · "}
                Received KES{" "}
                {Number(shortfall.actual_amount || 0).toLocaleString("en-KE")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowShortfall(true)}
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

      <section
        className="revenue-card"
        aria-labelledby="weekly-revenue-title"
      >
        <div className="card-heading">

          <div>
            <h2 id="weekly-revenue-title">
              Weekly Revenue
            </h2>

            <p>
              Last 7 days · daily target KES 42,000
            </p>
          </div>

          <div
            className="chart-legend"
            aria-label="Chart legend"
          >
            <span>
              <i className="legend-dot revenue-dot" />
              Revenue
            </span>

            <span>
              <i className="legend-dot target-dot" />
              Target
            </span>
          </div>

        </div>

        <div className="revenue-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={weeklyRevenue}
              margin={{
                top: 10,
                right: 8,
                left: 4,
                bottom: 4,
              }}
            >
              <CartesianGrid
                stroke="#e8eef4"
                strokeDasharray="3 4"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9aacc2",
                  fontSize: 12,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9aacc2",
                  fontSize: 12,
                }}
                tickFormatter={(value) =>
                  `${value / 1000}k`
                }
                width={36}
                domain={[0, 80000]}
              />

              <Tooltip
                content={<RevenueTooltip />}
                cursor={{
                  stroke: "#cbd8e5",
                  strokeDasharray: "4 4",
                }}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#203f68"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#0ca653",
                  strokeWidth: 0,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ==========================================================
          SHORTFALL MODAL
      ========================================================== */}

      {showShortfall && shortfall && (
  <ShortfallModal
    remittance={{
      ...shortfall,
      timestamp: shortfall.submitted_at,
      vehicle: `Vehicle #${shortfall.vehicle_id}`,
    }}
    onClose={() => setShowShortfall(false)}
    onResolved={() => {
      setShortfall(null);
      setShowShortfall(false);
    }}
  />
)}

    </div>
  );
}

export default Owner;
