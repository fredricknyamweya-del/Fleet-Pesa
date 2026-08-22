import { useCallback, useEffect, useState } from "react";

export function useFetch(url, options = {}) {
  const {
    immediate = true,
    ...fetchOptions
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (customOptions = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          ...customOptions,
          headers: {
            "Content-Type": "application/json",
            ...(fetchOptions.headers || {}),
            ...(customOptions.headers || {}),
          },
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error( result?.message || result?.error || `Request failed with status ${response.status}`
          );
        }

        setData(result);

        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, JSON.stringify(fetchOptions)]
  );

  useEffect(() => {
    if (!immediate) return;

    execute().catch(() => {
      
    });
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
}