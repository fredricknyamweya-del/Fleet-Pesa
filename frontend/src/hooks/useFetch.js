
import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5555/api";

export default function useFetch() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const request = useCallback(async (endpoint, options = {}) => {
    // Cancel the previous request
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const {
        method = "GET",
        body,
        headers = {},
        ...fetchOptions
      } = options;

      // Get authentication token
      // const token = localStorage.getItem("fleetpesa_token");
      const token = localStorage.getItem("access_token");

      const isFormData = body instanceof FormData;

      const requestHeaders = {
        Accept: "application/json",
        ...headers,
      };

      // Don't manually set Content-Type for FormData.
      // The browser will set the correct multipart boundary.
      if (!isFormData && body !== undefined && body !== null) {
        requestHeaders["Content-Type"] =
          requestHeaders["Content-Type"] || "application/json";
      }

      // Add JWT token when available
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }

      // Make request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body:
          body !== undefined &&
          body !== null &&
          method !== "GET" &&
          method !== "HEAD"
            ? isFormData
              ? body
              : JSON.stringify(body)
            : undefined,
        signal: controller.signal,
        ...fetchOptions,
      });

      // Parse response
      let responseData = null;

      if (response.status !== 204) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      }

      // Handle HTTP errors
      if (!response.ok) {
        const message =
          responseData?.message ||
          responseData?.error ||
          responseData?.msg ||
          `Request failed with status ${response.status}`;

        throw new Error(message);
      }

      // Only update state if this request wasn't cancelled
      if (!controller.signal.aborted) {
        setData(responseData);
      }

      return responseData;
    } catch (err) {
      // Abort is intentional, so don't show it as an error
      if (err?.name === "AbortError") {
        return null;
      }

      const message =
        err?.message || "Something went wrong. Please try again.";

      setError(message);

      throw err;
    } finally {
      // Only the active request controls loading
      if (
        abortControllerRef.current === controller &&
        !controller.signal.aborted
      ) {
        setLoading(false);
      }
    }
  }, []);

  // GET
  const get = useCallback(
    (endpoint, options = {}) => {
      return request(endpoint, {
        ...options,
        method: "GET",
      });
    },
    [request]
  );

  // POST
  const post = useCallback(
    (endpoint, body, options = {}) => {
      return request(endpoint, {
        ...options,
        method: "POST",
        body,
      });
    },
    [request]
  );

  // PUT
  const put = useCallback(
    (endpoint, body, options = {}) => {
      return request(endpoint, {
        ...options,
        method: "PUT",
        body,
      });
    },
    [request]
  );

  // PATCH
  const patch = useCallback(
    (endpoint, body, options = {}) => {
      return request(endpoint, {
        ...options,
        method: "PATCH",
        body,
      });
    },
    [request]
  );

  // DELETE
  const remove = useCallback(
    (endpoint, options = {}) => {
      return request(endpoint, {
        ...options,
        method: "DELETE",
      });
    },
    [request]
  );

  // Reset hook state
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  // Cancel request when component unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    data,
    loading,
    error,

    request,

    get,
    post,
    put,
    patch,
    remove,

    reset,
  };
}
