import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, History, Loader2 } from "lucide-react";
import useRemittanceHistory from "../hooks/useRemittanceHistory.js";
import { MOCK_VEHICLES } from "../data/mockVehicles.js";
import Pagination from "../components/shared/Pagination.jsx";

function currency(value) { return `KES ${Number(value || 0).toLocaleString("en-KE")}`; }
function dateLabel(value) { return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default function RemittanceHistoryPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId || "");
  const [filters, setFilters] = useState({ from: "", to: "", status: "all" });
  const [statusOpen, setStatusOpen] = useState(false);
  const history = useRemittanceHistory(vehicleId, filters);
  const mockVehicle = MOCK_VEHICLES.find((vehicle) => vehicle.id === selectedVehicleId);
  const vehicle = (mockVehicle && { plate_number: mockVehicle.plate_number, vehicle_type: mockVehicle.type }) || history.vehicle;

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearDates = () => {
    setFilters((current) => ({ ...current, from: "", to: "" }));
  };

  useEffect(() => {
    setSelectedVehicleId(vehicleId || "");
  }, [vehicleId]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-10 sm:p-6">
      <Link to="/owner/fleet" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Back to fleet</Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Remittance history</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{vehicle?.plate_number || "Vehicle remittances"}</h1>
        {vehicle?.vehicle_type && <p className="mt-1 text-sm text-slate-500">{vehicle.vehicle_type}</p>}
      </header>

      <section className="history-filter-bar" aria-label="Remittance filters">
        <label className="history-date-field">From<input type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} aria-label="Start date" /></label>
        <label className="history-date-field">To<input type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} aria-label="End date" /></label>
        <div className="history-status-field">
          <span>Status</span>
          <div className="history-status-control">
            <button type="button" className={`history-status-select${statusOpen || filters.status !== "all" ? " active" : ""}`} aria-haspopup="listbox" aria-expanded={statusOpen} onClick={() => setStatusOpen((open) => !open)}>
              {filters.status === "paid" ? "Paid" : filters.status === "short" ? "Shortfall" : "All statuses"}
            </button>
            {statusOpen && (
              <div className="history-status-menu" role="listbox" aria-label="Remittance status">
                {[{ value: "all", label: "All statuses" }, { value: "paid", label: "Paid" }, { value: "short", label: "Shortfall" }].map((option) => (
                  <button key={option.value} type="button" role="option" aria-selected={filters.status === option.value} className="history-status-option" onClick={() => { updateFilter("status", option.value); setStatusOpen(false); }}>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {(filters.from || filters.to) && <button type="button" className="history-clear-dates" onClick={clearDates}>Clear dates</button>}
        <label className="history-vehicle-picker">Vehicle<select value={selectedVehicleId} onChange={(event) => { setSelectedVehicleId(event.target.value); navigate(`/vehicles/${event.target.value}/remittances`); }}><option value="">Choose a vehicle</option>{MOCK_VEHICLES.map((item) => <option key={item.id} value={item.id}>{item.plate_number} · {item.driver_name}</option>)}</select></label>
      </section>

      {history.loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading remittances...</div> : history.error ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">{history.error}</p> : history.remittances.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center"><History className="mx-auto text-slate-400" size={30} /><p className="mt-3 text-sm font-semibold text-slate-700">No remittances recorded yet for this vehicle</p></div> : <div className="history-table-wrap"><table className="history-table"><thead><tr><th>Date submitted</th><th>Expected</th><th>Actual</th><th>Status</th><th>Payment</th></tr></thead><tbody>{history.remittances.map((item) => <tr key={item.id}><td className="history-date">{dateLabel(item.submitted_at)}</td><td>{currency(item.expected_amount)}</td><td>{currency(item.actual_amount)}</td><td><span className={`history-status ${item.status === "paid" ? "paid" : "short"}`}>{item.status}</span></td><td><span className="history-payment">{item.payment_status}</span></td></tr>)}</tbody></table></div>}
    </div>
  );
}