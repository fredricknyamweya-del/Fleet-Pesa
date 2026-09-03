import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getRemittances, getVehicles, getDriverAssignments } from "../lib/api.js";
import { MOCK_OWNER_NOTIFICATIONS } from "../data/mockNotifications.js";

function money(value) {
  return Number(value || 0).toLocaleString("en-KE");
}

function extractList(payload, keys) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function buildOwnerNotifications(remittances, vehicleLookup, assignments) {
  const remittanceNotifications = remittances
    .slice()
    .sort(
      (a, b) =>
        new Date(b.submitted_at || b.created_at) -
        new Date(a.submitted_at || a.created_at)
    )
    .slice(0, 5)
    .map((item, index) => {
      const vehicle = vehicleLookup.get(item.vehicle_id);
      const driverName =
        vehicle?.driver_name || item.driver_name || `Driver #${item.driver_id ?? "?"}`;
      const vehiclePlate =
        vehicle?.plate_number || item.vehicle_plate || `Vehicle #${item.vehicle_id}`;
      const amount = Number(item.actual_amount ?? item.amount ?? 0);
      const expected = Number(item.expected_amount ?? 0);
      const createdAt = item.submitted_at || item.created_at;
      const isShort = item.status === "short" || (expected > 0 && amount < expected);

      if (isShort) {
        return {
          id: `shortfall-${item.id}`,
          type: "shortfall",
          title: "Remittance shortfall",
          message: `${driverName} remitted KES ${money(amount)} of KES ${money(expected)} expected.`,
          amount: expected - amount,
          driver_name: driverName,
          vehicle_registration: vehiclePlate,
          is_read: index > 1,
          created_at: createdAt,
        };
      }

      return {
        id: `remittance-${item.id}`,
        type: "remittance_received",
        title: "Daily remittance received",
        message: `${driverName} sent KES ${money(amount)}.`,
        amount,
        driver_name: driverName,
        vehicle_registration: vehiclePlate,
        is_read: index > 1,
        created_at: createdAt,
      };
    });

  const assignmentNotifications = assignments
    .filter((assignment) => {
      const status = String(assignment?.status || "").toLowerCase();
      return status === "active" || status === "assigned";
    })
    .slice()
    .sort(
      (a, b) =>
        new Date(b.assigned_at || b.created_at) -
        new Date(a.assigned_at || a.created_at)
    )
    .slice(0, 3)
    .map((assignment, index) => {
      const vehicle = vehicleLookup.get(assignment.vehicle_id);
      const driverName =
        assignment.driver_name || assignment.driver?.name || `Driver #${assignment.driver_id ?? "?"}`;
      const vehiclePlate =
        vehicle?.plate_number || assignment.vehicle_registration || `Vehicle #${assignment.vehicle_id}`;

      return {
        id: `assignment-${assignment.id}`,
        type: "vehicle_assigned",
        title: "Vehicle assigned",
        message: `${vehiclePlate} has been assigned to ${driverName}.`,
        driver_name: driverName,
        vehicle_registration: vehiclePlate,
        is_read: index > 0,
        created_at: assignment.assigned_at || assignment.created_at,
      };
    });

  return [...remittanceNotifications, ...assignmentNotifications].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

export default function useOwnerNotifications({ enabled = true } = {}) {
  const { token } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", notifications: [] });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, error: "", notifications: [] });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: "" }));

    const isMock = token?.startsWith("mock-");

    const request = isMock
      ? new Promise((resolve) =>
          window.setTimeout(() => resolve(MOCK_OWNER_NOTIFICATIONS), 250)
        )
      : Promise.all([
          getRemittances({ per_page: 20 }),
          getVehicles({ per_page: 100 }),
          getDriverAssignments({ per_page: 20 }),
        ]).then(([remittanceData, vehicleData, assignmentData]) => {
          const vehicles = extractList(vehicleData, ["vehicles", "data", "items"]);
          const vehicleLookup = new Map(vehicles.map((v) => [v.id, v]));
          const remittances = extractList(remittanceData, ["remittances", "data", "items"]);
          const assignments = extractList(assignmentData, [
            "assignments",
            "driver_assignments",
            "data",
            "items",
          ]);

          return buildOwnerNotifications(remittances, vehicleLookup, assignments);
        });

    request
      .then((notifications) => {
        if (!cancelled) setState({ loading: false, error: "", notifications });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: error.message, notifications: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [token, enabled]);

  return state;
}
