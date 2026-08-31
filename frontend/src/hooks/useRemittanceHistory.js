import { useEffect, useState } from "react";
import { getVehicleRemittanceHistory } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { MOCK_VEHICLES } from "../data/mockVehicles.js";
import { MOCK_REMITTANCES } from "../data/mockRemittances.js";

export default function useRemittanceHistory(vehicleId, filters, page = 1, perPage = 10) {
  const { token } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", vehicle: null, remittances: [], pagination: null });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: "" }));
    const request = token?.startsWith("mock-token") || String(vehicleId).startsWith("mock-")
      ? new Promise((resolve) => window.setTimeout(() => {
          const vehicle = MOCK_VEHICLES.find((item) => item.id === vehicleId);
          const filtered = MOCK_REMITTANCES
            .filter((item) => item.vehicle_id === vehicleId)
            .filter((item) => !filters.status || filters.status === "all" || item.status === filters.status)
            .filter((item) => !filters.from || item.submitted_at.slice(0, 10) >= filters.from)
            .filter((item) => !filters.to || item.submitted_at.slice(0, 10) <= filters.to);
          const total = filtered.length;
          const start = (page - 1) * perPage;
          const remittances = filtered.slice(start, start + perPage);
          resolve({
            vehicle: vehicle ? { id: vehicle.id, plate_number: vehicle.plate_number, vehicle_type: vehicle.type } : null,
            remittances,
            pagination: { page, per_page: perPage, total, total_pages: total ? Math.ceil(total / perPage) : 0 },
          });
        }, 250))
      : getVehicleRemittanceHistory(vehicleId, { ...filters, page, per_page: perPage });
    request
      .then((data) => { if (!cancelled) setState({ loading: false, error: "", vehicle: data.vehicle, remittances: data.remittances || [], pagination: data.pagination || null }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, error: error.message, vehicle: null, remittances: [], pagination: null }); });
    return () => { cancelled = true; };
  }, [token, vehicleId, filters, page, perPage]);

  return state;
}