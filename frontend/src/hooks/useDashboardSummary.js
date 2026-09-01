import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getRemittances } from "../lib/api.js";
import { MOCK_REMITTANCES } from "../data/mockRemittances.js";
import { MOCK_VEHICLES } from "../data/mockVehicles.js";

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildSummary(remittances, vehicleLookup) {
  const today = startOfDay(new Date());

  const todayRemittances = remittances.filter((item) => {
    const submitted = new Date(item.submitted_at);
    return startOfDay(submitted).getTime() === today.getTime();
  });

  const todaysRevenue = todayRemittances.reduce(
    (sum, item) => sum + Number(item.actual_amount || 0),
    0
  );

  const outstanding = remittances
    .filter((item) => item.status === "short")
    .reduce(
      (sum, item) =>
        sum + Math.max(Number(item.expected_amount || 0) - Number(item.actual_amount || 0), 0),
      0
    );

  const shortfallCount = remittances.filter(
    (item) => item.status === "short" && item.flagged_for_followup !== false
  ).length;

  const vehicleIds = new Set(remittances.map((item) => item.vehicle_id));
  const driverIds = new Set(
    remittances.map((item) => item.driver_id).filter((id) => id != null)
  );

  const shortfallList = remittances
    .filter((item) => item.status === "short")
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .map((item) => {
      const vehicle = vehicleLookup.get(item.vehicle_id);
      return {
        id: item.id,
        driver_name: vehicle?.driver_name || `Driver #${item.driver_id ?? "?"}`,
        vehicle: vehicle?.plate_number || `Vehicle #${item.vehicle_id}`,
        expected_amount: Number(item.expected_amount || 0),
        actual_amount: Number(item.actual_amount || 0),
        timestamp: item.submitted_at,
        flagged_for_followup: item.flagged_for_followup,
      };
    });

  return {
    todaysRevenue,
    outstanding,
    shortfallCount,
    vehicleCount: vehicleIds.size,
    driverCount: driverIds.size,
    shortfallList,
  };
}

export default function useDashboardSummary() {
  const { token } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", summary: null });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: "" }));

    const isMock = token?.startsWith("mock-token");

    const request = isMock
      ? new Promise((resolve) =>
          window.setTimeout(() => {
            const vehicleLookup = new Map(
              MOCK_VEHICLES.map((v) => [v.id, v])
            );
            resolve(buildSummary(MOCK_REMITTANCES, vehicleLookup));
          }, 250)
        )
      : getRemittances({ per_page: 100 }).then((data) => {
          const vehicleLookup = new Map();
          return buildSummary(data.remittances || [], vehicleLookup);
        });

    request
      .then((summary) => {
        if (!cancelled) setState({ loading: false, error: "", summary });
      })
      .catch((error) => {
        if (!cancelled)
          setState({ loading: false, error: error.message, summary: null });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return state;
}
