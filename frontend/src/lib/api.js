import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


// ============================================================
// TOKEN HELPERS
// ============================================================

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

// ============================================================
// AUTOMATIC TOKEN REFRESH
// ============================================================

let refreshPromise = null;

async function refreshAccessTokenInternal() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const newAccessToken = response.data.access_token;

  if (!newAccessToken) {
    throw new Error("Refresh response did not contain an access token.");
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

  return newAccessToken;
}


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessTokenInternal().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);


// ============================================================
// AUTH
// ============================================================

export async function login({ username, password }) {
  try {
    const response = await api.post("/auth/login", {
      username,
      password,
    });

    const data = response.data;

    saveTokens(
      data.access_token,
      data.refresh_token
    );

    return data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to log in.";

    throw new Error(message);
  }
}


export async function register({
  username,
  name,
  phone,
  password,
  role,
  account_name,
  fleet_owner_id,
  notification_preference,
}) {
  try {
    const response = await api.post("/auth/signup", {
      username,
      name,
      phone,
      password,
      role,
      account_name,
      fleet_owner_id,
      notification_preference,
    });

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to create account.";

    throw new Error(message);
  }
}


// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser() {
  try {
    const response = await api.get("/auth/me");

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load user account.";

    throw new Error(message);
  }
}


// ============================================================
// REFRESH TOKEN
// ============================================================

export async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available.");
    }

    const response = await api.post(
      "/auth/refresh",
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    const accessToken = response.data.access_token;

    if (accessToken) {
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        accessToken
      );
    }

    return accessToken;
  } catch (error) {
    clearTokens();

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Session expired. Please log in again.";

    throw new Error(message);
  }
}


// ============================================================
// PROFILE
// ============================================================

export async function updateProfile(profileData) {
  try {
    const response = await api.patch(
      "/users/me",
      profileData
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to update profile.";

    throw new Error(message);
  }
}


export async function updatePassword(passwordData) {
  try {
    const response = await api.patch(
      "/users/me/password",
      passwordData
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to update password.";

    throw new Error(message);
  }
}


// ============================================================
// VEHICLES
// ============================================================

export async function listVehicles() {
  try {
    const response = await api.get("/vehicles");

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load vehicles.";

    throw new Error(message);
  }
}


export async function getVehicle(vehicleId) {
  try {
    const response = await api.get(
      `/vehicles/${vehicleId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load vehicle.";

    throw new Error(message);
  }
}


export async function createVehicle(vehicleData) {
  try {
    const response = await api.post(
      "/vehicles",
      vehicleData
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to create vehicle.";

    throw new Error(message);
  }
}


export async function updateVehicle(
  vehicleId,
  vehicleData
) {
  try {
    const response = await api.patch(
      `/vehicles/${vehicleId}`,
      vehicleData
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to update vehicle.";

    throw new Error(message);
  }
}


export async function deleteVehicle(vehicleId) {
  try {
    const response = await api.delete(
      `/vehicles/${vehicleId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to remove vehicle.";

    throw new Error(message);
  }
}


// ============================================================
// DRIVER ASSIGNMENTS
// ============================================================

export async function listDriverAssignments() {
  try {
    const response = await api.get(
      "/driver-assignments"
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load driver assignments.";

    throw new Error(message);
  }
}


export async function assignDriver(
  vehicleId,
  driverId
) {
  try {
    const response = await api.post(
      `/vehicles/${vehicleId}/assign-driver`,
      {
        driver_id: driverId,
      }
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to assign driver.";

    throw new Error(message);
  }
}


export async function unassignDriver(
  assignmentId
) {
  try {
    const response = await api.patch(
      `/driver-assignments/${assignmentId}/unassign`
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to unassign driver.";

    throw new Error(message);
  }
}


export async function getVehicleDriverHistory(
  vehicleId
) {
  try {
    const response = await api.get(
      `/vehicles/${vehicleId}/driver-history`
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load driver history.";

    throw new Error(message);
  }
}


// ============================================================
// REMITTANCES
// ============================================================

export async function listRemittances(
  params = {}
) {
  try {
    const response = await api.get(
      "/remittances",
      { params }
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load remittances.";

    throw new Error(message);
  }
}


export async function getVehicleRemittanceHistory(
  vehicleId,
  params = {}
) {
  try {
    const response = await api.get(
      `/vehicles/${vehicleId}/remittances`,
      { params }
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load remittance history.";

    throw new Error(message);
  }
}


export async function updateRemittance(
  remittanceId,
  data
) {
  try {
    const response = await api.patch(
      `/remittances/${remittanceId}`,
      data
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to update remittance.";

    throw new Error(message);
  }
}


export async function promptRemittance(
  remittanceId
) {
  try {
    const response = await api.post(
      `/remittances/${remittanceId}/prompt`
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to prompt remittance.";

    throw new Error(message);
  }
}


// ============================================================
// FARE PAYMENTS
// ============================================================

export async function createFarePayment(
  paymentData
) {
  try {
    const response = await api.post(
      "/fare-payments",
      paymentData
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to create fare payment.";

    throw new Error(message);
  }
}


export async function getFarePayment(
  paymentId
) {
  try {
    const response = await api.get(
      `/fare-payments/${paymentId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Unable to load fare payment.";

    throw new Error(message);
  }
}


export default api;
