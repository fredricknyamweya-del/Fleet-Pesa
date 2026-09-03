
import axios from "axios";

// API CONFIGURATION

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// AXIOS INSTANCE


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});


// TOKEN STORAGE


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



api.interceptors.request.use(
  (config) => {const token = getAccessToken();

    
    console.log(
      "[API AUTH]",
      config.method?.toUpperCase(),
      config.url,
      token
        ? `TOKEN PRESENT (${token.length} chars)`
        : "NO TOKEN"
    );

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status = error?.response?.status;

    console.error(
      "[API ERROR]", error?.config?.method?.toUpperCase(),
      error?.config?.url,"STATUS:", status, "DATA:",
      error?.response?.data
    );

    return Promise.reject(error);
  }
);


// ERROR HELPER

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.response?.data?.msg ||
    error?.message || fallbackMessage);
}

// AUTH - LOGIN

export async function login(credentials) {
  try {
    const response = await api.post("/auth/login",credentials);

    const data = response.data;

    const accessToken =
      data?.access_token ||data?.token;

    const refreshToken =
      data?.refresh_token;

    if (!accessToken) {
      throw new Error("Login succeeded but the backend did not return an authentication token.");}

    saveTokens(accessToken,refreshToken);

    console.log("[AUTH] Login successful. Access token saved:", `${accessToken.length} chars`);

    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to log in. Please try again."));
  }
}

// AUTH - SIGN UP

export async function register(userData) {
  try {
    const response = await api.post("/auth/signup", userData);

    const data = response.data;

    const accessToken = data?.access_token || data?.token;

    const refreshToken = data?.refresh_token;

    if (accessToken) {
      saveTokens( accessToken, refreshToken );
    }

    return data;
  } catch (error) {
    throw new Error( getErrorMessage( error, "Unable to create account. Please try again."));
  }
}

// AUTH - FORGOT PASSWORD

export async function forgotPassword(phone) {
  try {
    const response = await api.post( "/auth/forgot-password", { phone,});

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to process password reset request."
      )
    );
  }
}


// AUTH - RESET PASSWORD

export async function resetPassword(
  resetToken,
  newPassword
) {
  try {
    const response = await api.post(
      "/auth/reset-password",
      {
        reset_token: resetToken,
        new_password: newPassword,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to reset password."
      )
    );
  }
}

// AUTH - UPDATE PROFILE

export async function updateProfile(profileData) {
  try {
    const response = await api.put(
      "/auth/profile",
      profileData
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to update profile."
      )
    );
  }
}

// AUTH - UPDATE PASSWORD


export async function updatePassword(
  currentPassword,
  newPassword
) {
  try {
    const response = await api.put(
      "/auth/password",
      {
        current_password: currentPassword,
        new_password: newPassword,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to update password."
      )
    );
  }
}

// DRIVER ASSIGNMENTS

export async function getDriverAssignments(
  params = {}
) {
  try {
    const response = await api.get(
      "/driver-assignments",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load driver assignments."
      )
    );
  }
}

export async function createDriverAssignment(data) {
  try {
    const response = await api.post(
      "/driver-assignments",
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to create driver assignment."
      )
    );
  }
}

export async function getDriverAssignment(id) {
  try {
    const response = await api.get(
      `/driver-assignments/${id}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load driver assignment."
      )
    );
  }
}

export async function updateDriverAssignment(
  id,
  data
) {
  try {
    const response = await api.put(
      `/driver-assignments/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to update driver assignment."
      )
    );
  }
}

export async function deleteDriverAssignment(id) {
  try {
    const response = await api.delete(
      `/driver-assignments/${id}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to delete driver assignment."
      )
    );
  }
}

export async function unassignDriver(id) {
  try {
    const response = await api.post(
      `/driver-assignments/${id}/unassign`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to unassign driver."
      )
    );
  }
}

// VEHICLE DRIVER HISTORY

export async function getVehicleDriverHistory(
  vehicleId
) {
  try {
    const response = await api.get(
      `/vehicles/${vehicleId}/driver-history`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load vehicle driver history."
      )
    );
  }
}

// VEHICLES

export async function getVehicles(params = {}) {
  try {
    const response = await api.get(
      "/vehicles",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load vehicles."
      )
    );
  }
}

export async function createVehicle(data) {
  try {
    const response = await api.post(
      "/vehicles",
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to create vehicle."
      )
    );
  }
}

export async function getVehicle(vehicleId) {
  try {
    const response = await api.get(
      `/vehicles/${vehicleId}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load vehicle."
      )
    );
  }
}

export async function updateVehicle(
  vehicleId,
  data
) {
  try {
    const response = await api.put(
      `/vehicles/${vehicleId}`,
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to update vehicle."
      )
    );
  }
}

export async function deleteVehicle(vehicleId) {
  try {
    const response = await api.delete(
      `/vehicles/${vehicleId}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to delete vehicle."
      )
    );
  }
}

// VEHICLE REMITTANCE HISTORY

export async function getVehicleRemittanceHistory(
  vehicleId,
  { status, from, to, page, per_page } = {}
) {
  try {
    const response = await api.get(
<<<<<<< HEAD
      `/vehicles/${vehicleId}/remittances`,
      { params: { status, from, to, page, per_page } }
=======
      `/vehicles/${vehicleId}/remittances`
>>>>>>> origin/dev
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load vehicle remittance history."
      )
    );
  }
}


// REMITTANCES

export async function getRemittances(
  params = {}
) {
  try {
    const response = await api.get(
      "/remittances",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load remittances."
      )
    );
  }
}

export async function createRemittance(data) {
  try {
    const response = await api.post(
      "/remittances",
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to create remittance."
      )
    );
  }
}

export async function getRemittance(
  remittanceId
) {
  try {
    const response = await api.get(
      `/remittances/${remittanceId}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load remittance."
      )
    );
  }
}

export async function updateRemittance(
  remittanceId,
  data
) {
  try {
    const response = await api.put(
      `/remittances/${remittanceId}`,
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to update remittance."
      )
    );
  }
}

export async function deleteRemittance(
  remittanceId
) {
  try {
    const response = await api.delete(
      `/remittances/${remittanceId}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to delete remittance."
      )
    );
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
    throw new Error(
      getErrorMessage(
        error,
        "Unable to send remittance prompt."
      )
    );
  }
}

// FARE PAYMENTS

export async function createFarePayment(data) {
  try {
    const response = await api.post(
      "/fare-payments",
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to create fare payment."
      )
    );
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
    throw new Error(
      getErrorMessage(
        error,
        "Unable to load fare payment."
      )
    );
  }
}

export async function updateFarePayment(
  paymentId,
  data
) {
  try {
    const response = await api.put(
      `/fare-payments/${paymentId}`,
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to update fare payment."
      )
    );
  }
}

// M-PESA CALLBACK

export async function farePaymentCallback(data) {
  try {
    const response = await api.post(
      "/fare-payments/mpesa-callback",
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to process M-Pesa callback."
      )
    );
  }
}

// HEALTH CHECK

export async function healthCheck() {
  try {
    const response = await api.get("/");

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Backend is unavailable."
      )
    );
  }
}


<<<<<<< HEAD
// ============================================================
// VEHICLES LIST
// ============================================================

export async function getVehicles({ page, per_page } = {}) {
  try {
    const response = await api.get("/vehicles", {
      params: { page, per_page },
    });

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Unable to load vehicles.";

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
=======
>>>>>>> origin/dev
// LOGOUT

export function logout() {
  clearTokens();
}

// DEFAULT EXPORT

export default api;
