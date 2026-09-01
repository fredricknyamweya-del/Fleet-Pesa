import { useState } from "react";
import * as api from "../../lib/api.js";
import Avatar from "../../components/shared/Avatar.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Not available";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function ShortfallModal({ remittance, onClose, onResolved }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [resolved, setResolved] = useState(false);

  if (!remittance) return null;

  const expectedAmount = Number(remittance.expected_amount || 0);
  const actualAmount = Number(remittance.actual_amount || 0);
  const shortfall = Math.max(expectedAmount - actualAmount, 0);

  const handleMarkResolved = async () => {
    if (!remittance?.id) {
      setStatus({ type: "error", message: "This shortfall record is missing an id, so it cannot be marked resolved." });
      return;
    }

    if (typeof api.updateRemittance !== "function") {
      setStatus({
        type: "error",
        message: "updateRemittance() is missing from lib/api.js. Please add the shared API method before using this action.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      await api.updateRemittance(remittance.id, {
        resolved: true,
        flagged_for_followup: false,
      });
      if (typeof onResolved === "function") {
        onResolved();
      }
      setStatus({
        type: "success",
        message: "This shortfall has been marked as resolved.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Unable to mark this shortfall as resolved. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={remittance.driver_name || "Driver"} size="md" className="bg-slate-800 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Driver Shortfall
              </p>
              <h2 className="truncate text-lg font-bold text-slate-900">{remittance.driver_name || "Driver"}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={resolved ? "Completed" : "Pending review"} tone={resolved ? "green" : "amber"} />
          </div>

          {resolved ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-700">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold">✓</span>
                <p className="text-sm font-semibold uppercase tracking-[0.12em]">Shortfall resolved</p>
              </div>
              <p className="text-sm text-emerald-800">
                Payment has been confirmed and this shortfall has been marked resolved.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Expected
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(expectedAmount)}</p>
                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600">
                      Actual
                    </p>
                    <p className="mt-2 text-2xl font-bold text-red-700">{formatCurrency(actualAmount)}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  Shortfall: {formatCurrency(shortfall)}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Vehicle
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {remittance.vehicle || "N/A"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Timestamp
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatTimestamp(remittance.timestamp)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Reference
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {remittance.id || "Remittance record"}
                </p>
              </div>
            </>
          )}

          <div className="pt-1">
            {status.type !== "idle" && (
              <p
                className={`mb-3 text-sm ${
                  status.type === "success" ? "text-emerald-600" : "text-red-600"
                }`}
                role={status.type === "error" ? "alert" : "status"}
              >
                {status.message}
              </p>
            )}

            {!resolved && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleMarkResolved}
                  disabled={isSubmitting || resolved}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isSubmitting ? "Marking as resolved..." : "Mark as Resolved"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
