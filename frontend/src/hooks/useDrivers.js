import { useCallback, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/drivers`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to fetch drivers"
        );
      }

      setDrivers(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  
  const getDriver = useCallback(async (driverId) => {
    if (!driverId) {
      throw new Error("Driver ID is required");
    }

    try {
      const response = await fetch(
        `${API_URL}/drivers/${driverId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to fetch driver"
        );
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    drivers,
    loading,
    error,
    fetchDrivers,
    getDriver,
  };
}