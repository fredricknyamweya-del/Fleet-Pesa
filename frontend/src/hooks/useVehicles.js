import { useCallback, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) { throw new Error( data.message || data.error || "Failed to fetch vehicles");}

      setVehicles(data);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  
  const fetchVehicle = useCallback(async (vehicleId) => {
    if (!vehicleId) {
      throw new Error("Vehicle ID is required");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/vehicles/${vehicleId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) { throw new Error( data.message || data.error || "Failed to fetch vehicle"
        );
      }

      setVehicle(data);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  
  const getDriverVehicle = useCallback(async (driverId) => {
    if (!driverId) {
      throw new Error("Driver ID is required");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/drivers/${driverId}/vehicle`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error( data.message || data.error || "Failed to fetch driver's vehicle");
      }

      setVehicle(data);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vehicles,
    vehicle,
    loading,
    error,
    fetchVehicles,
    fetchVehicle,
    getDriverVehicle,
  };
}