import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BusFront, Loader2, Phone, TriangleAlert } from "lucide-react";
import { MOCK_VEHICLES } from "../../data/mockVehicles.js";
import * as api from "../../lib/api.js";
import Avatar from "../../components/shared/Avatar.jsx";
import Pagination from "../../components/shared/Pagination.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (timestamp) => {
  if (!timestamp) return "Not available";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const STATUS_TONE = {
  paid: "green",
  late: "amber",
  short: "red",
};

function statusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStoredVehicles() {
  try {
    const stored = localStorage.getItem("fleetpesa_mock_vehicles");
    const vehicles = stored ? JSON.parse(stored) : MOCK_VEHICLES;
    return Array.isArray(vehicles)
      ? vehicles.map((item) => ({
          ...item,
          status: item.status === "available" ? "parked" : item.status,
        }))
      : MOCK_VEHICLES;
  } catch {
    return MOCK_VEHICLES;
  }
}

export default function VehicleDetailPage() {
  const { id } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [remittances, setRemittances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [remittancePage, setRemittancePage] = useState(1);
  const remittancePageSize = 5;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      setRemittancePage(1);

      try {
        const localVehicle = getStoredVehicles().find((item) => item.id === id);
        if (localVehicle) {
          if (!isMounted) return;
          setVehicle(localVehicle);
          setRemittances([]);
          return;
        }

        const [vehicleData, remittanceData] = await Promise.all([
          api.getVehicle(id),
          api.getVehicleRemittanceHistory(id),
        ]);

        if (!isMounted) return;
        setVehicle(vehicleData);
        setRemittances(
          Array.isArray(remittanceData) ? remittanceData : remittanceData?.remittances || []
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Unable to load this vehicle right now. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (id) load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const remittancePageCount = Math.ceil(remittances.length / remittancePageSize);
  const visibleRemittances = remittances.slice(
    (remittancePage - 1) * remittancePageSize,
    remittancePage * remittancePageSize,
  );

  const updateVehicleStatus = (status) => {
    setVehicle((current) => (current ? { ...current, status } : current));

    if (vehicle?.id?.startsWith("mock-")) {
      const vehicles = getStoredVehicles().map((item) =>
        item.id === vehicle.id ? { ...item, status } : item
      );
      localStorage.setItem("fleetpesa_mock_vehicles", JSON.stringify(vehicles));
    }
  };

  const totalExpected = remittances.reduce((sum, r) => sum + Number(r.expected_amount || 0), 0);
  const totalActual = remittances.reduce((sum, r) => sum + Number(r.actual_amount || 0), 0);
  const totalShortfall = Math.max(totalExpected - totalActual, 0);
  const flaggedCount = remittances.filter((r) => r.flagged_for_followup).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm font-medium">Loading vehicle details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <TriangleAlert className="mx-auto mb-2 h-6 w-6 text-red-600" />
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <Link
          to="/owner/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm font-semibold text-slate-600">Vehicle not found.</p>
        <Link
          to="/owner/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-10 sm:p-6">
      <Link
        to="/owner/fleet"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to fleet
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white">
              <BusFront className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Vehicle Profile
              </p>
              <h1 className="text-xl font-bold text-slate-900">
                {vehicle.plate_number || "Unregistered"}
              </h1>
              <p className="text-sm text-slate-500">{vehicle.type || "Vehicle"}</p>
            </div>
          </div>
          <StatusBadge
            label={flaggedCount > 0 ? `${flaggedCount} flagged` : "No flags"}
            tone={flaggedCount > 0 ? "red" : "green"}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Expected total
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(totalExpected)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Collected total
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(totalActual)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Shortfall
            </p>
            <p className="mt-2 text-lg font-bold text-red-600">{formatCurrency(totalShortfall)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Avatar name={vehicle.driver_name || "Unassigned"} size="md" className="bg-slate-800" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Assigned driver
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {vehicle.driver_name || "No driver assigned"}
            </p>
          </div>
          {vehicle.driver_phone && (
            <a
              href={`tel:${vehicle.driver_phone}`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Phone className="h-4 w-4" /> {vehicle.driver_phone}
            </a>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Vehicle status
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Vehicle status">
            {[
              { value: "active", label: "Active" },
              { value: "parked", label: "Parked" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateVehicleStatus(option.value)}
                aria-pressed={vehicle.status === option.value}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${vehicle.status === option.value ? "border-[#16A34A] bg-[#16A34A] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#16A34A] hover:text-[#16A34A]"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Remittance History</h2>
          <span className="text-xs font-medium text-slate-500">{remittances.length} records</span>
        </div>

        {remittances.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No remittances recorded for this vehicle yet.
          </p>
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {visibleRemittances.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{formatDate(r.timestamp)}</p>
                    <StatusBadge label={statusLabel(r.status)} tone={STATUS_TONE[r.status] || "slate"} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Expected {formatCurrency(r.expected_amount)}</span>
                    <span className="font-semibold text-slate-900">
                      Paid {formatCurrency(r.actual_amount)}
                    </span>
                  </div>
                  {r.flagged_for_followup && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <TriangleAlert className="h-3.5 w-3.5" /> Flagged for follow-up
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Expected</th>
                    <th className="pb-2 pr-4">Actual</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRemittances.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 text-slate-700">{formatDate(r.timestamp)}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatCurrency(r.expected_amount)}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {formatCurrency(r.actual_amount)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge label={statusLabel(r.status)} tone={STATUS_TONE[r.status] || "slate"} />
                      </td>
                      <td className="py-3">
                        {r.flagged_for_followup ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <TriangleAlert className="h-3.5 w-3.5" /> Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={remittancePage} pageCount={remittancePageCount} onPageChange={setRemittancePage} />
          </>
        )}
      </section>
    </div>
  );
}
