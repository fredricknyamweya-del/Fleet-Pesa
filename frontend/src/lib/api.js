import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ============================================================
// MOCK AUTH FOR FRONTEND DEMO
// ============================================================

const PHONE_PATTERN = /^07\d{8}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

function validateMockPhone(phone) {
  const cleanPhone = (phone || "").replace(/\s+/g, "");

  if (!PHONE_PATTERN.test(cleanPhone)) {
    throw new Error("Phone number must be 10 digits in the format 0701234567");
  }

  return cleanPhone;
}

function validateMockPassword(password) {
  if (!PASSWORD_PATTERN.test(String(password || ""))) {
    throw new Error("Password must be at least 6 characters and include letters, numbers, and special characters.");
  }

  return String(password);
}

function makeMockAuth({ role = "owner", phone = "", password = "", username = "", name = "" }) {
  const safePhone = validateMockPhone(phone);
  const safePassword = validateMockPassword(password);
  const safeRole = role || "owner";
  const mockToken = `mock-${safeRole}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const user = {
    id: `mock-user-${Date.now()}`,
    username: (username || safePhone || "demo-user").trim() || "demo-user",
    name: (name || "Demo User").trim() || "Demo User",
    phone: safePhone,
    role: safeRole,
    password: safePassword,
  };

  return {
    token: mockToken,
    access_token: mockToken,
    refresh_token: mockToken,
    user,
    message: "Mock authentication successful.",
  };
}

export async function login({ phone, password, role }) {
  const cleanPhone = validateMockPhone(phone);
  validateMockPassword(password);

  const data = makeMockAuth({ phone: cleanPhone, password, role });

  saveTokens(data.access_token, data.refresh_token);

  return data;
}

export async function register({
  username,
  name,
  phone,
  password,
  role,
}) {
  const cleanPhone = validateMockPhone(phone);
  validateMockPassword(password);

  const data = makeMockAuth({
    username,
    name,
    phone: cleanPhone,
    password,
    role,
  });

  saveTokens(data.access_token, data.refresh_token);

  return data;
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
// UPDATE PROFILE
// ============================================================
//
// IMPORTANT:
// Change "/profile" below if your Flask backend uses a
// different profile endpoint.
// ============================================================

export async function updateProfile(profileData) {
  try {
    const response = await api.put(
      "/profile",
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


// ============================================================
// UPDATE PASSWORD
// ============================================================
//
// IMPORTANT:
// Change "/profile/password" below if your Flask backend
// uses a different password endpoint.
// ============================================================

export async function updatePassword(passwordData) {
  try {
    const response = await api.put(
      "/profile/password",
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
// VEHICLE REMITTANCE HISTORY
// ============================================================
//
// IMPORTANT:
// Change this endpoint if your Flask backend uses a
// different URL.
// ============================================================

export async function getVehicleRemittanceHistory(
  vehicleId,
  { status, from, to, page, per_page } = {}
) {
  try {
    const response = await api.get(
      `/vehicles/${vehicleId}/remittances`,
      { params: { status, from, to, page, per_page } }
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


// ============================================================
// REMITTANCES LIST
// ============================================================

export async function getRemittances({ status, vehicle_id, driver_id, from, to, page, per_page } = {}) {
  try {
    const response = await api.get("/remittances", {
      params: { status, vehicle_id, driver_id, from, to, page, per_page },
    });

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Unable to load remittances.";

    throw new Error(message);
  }
}


// ============================================================
// UPDATE REMITTANCE
// ============================================================

export async function updateRemittance(remittanceId, data) {
  try {
    const response = await api.patch(
      `/remittances/${remittanceId}`,
      data
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Unable to update remittance.";

    throw new Error(message);
  }
}


// ============================================================
// LOGOUT
// ============================================================

export function logout() {
  clearTokens();
}


export default api;
