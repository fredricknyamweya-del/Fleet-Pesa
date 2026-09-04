import axios from "axios";


const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";



function getCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split("; ");

  const cookie = cookies.find(
    (row) => row.startsWith(`${name}=`)
  );

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(name.length + 1)
  );
}



export const api = axios.create({
  baseURL: API_BASE_URL,

  
  withCredentials: true,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});



function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.msg ||
    error?.message ||
    fallbackMessage
  );
}



api.interceptors.request.use(
  (config) => {
    

    const isRefreshRequest =
      config.url === "/auth/refresh";

    const csrfCookieName = isRefreshRequest
      ? "csrf_refresh_token"
      : "csrf_access_token";

    const csrfToken = getCookie(
      csrfCookieName
    );

    if (csrfToken) {
      config.headers = config.headers || {};

      config.headers["X-CSRF-TOKEN"] =
        csrfToken;
    }

    console.log(
      "[API REQUEST]",
      config.method?.toUpperCase(), config.url);

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
    console.error("[API ERROR]", error?.config?.method?.toUpperCase(), error?.config?.url,
      "STATUS:",  error?.response?.status, "DATA:", error?.response?.data
    );

    return Promise.reject(error);
  }
);



export async function login(credentials) {
  try {
    const response = await api.post("/auth/login", credentials);
    console.log("[AUTH] Login successful.");

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to log in. Please try again."
      )
    );
  }
}



export async function logout() {
  try {
   
    const response = await api.post("/auth/logout");
    console.log("[AUTH] Logout request successful.");
    return response.data;
  } catch (error) {
    console.error("[AUTH] Logout failed:", error);

    throw new Error(
      getErrorMessage( error, "Unable to log out.")
    );
  }
}



export async function register(userData) {
  try {
    const response = await api.post("/auth/signup", userData);

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to create account. Please try again."
      )
    );
  }
}



export async function forgotPassword(phone) {
  try {
    const response = await api.post("/auth/forgot-password",{ phone });

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error,"Unable to process password reset request.")
    );
  }
}



export async function resetPassword(
  resetToken,
  newPassword
) {
  try {
    const response = await api.post("/auth/reset-password",
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



export async function updateProfile(
  profileData
) {
  try {
    const response = await api.put("/auth/profile",profileData);

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



export async function updatePassword(currentPassword, newPassword
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



export async function getDriverAssignments(
  params = {}
) {
  try {
    const response = await api.get("/driver-assignments",
      { params }
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

export async function createDriverAssignment(
  data
) {
  try {
    const response = await api.post("/driver-assignments",
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
    const response = await api.get(`/driver-assignments/${id}`
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



export async function getVehicles(
  params = {}
) {
  try {
    const response = await api.get(
      "/vehicles",
      { params }
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



export async function getVehicleRemittanceHistory(
  vehicleId
) {
  try {
    const response = await api.get(
      `/vehicles/${vehicleId}/remittances`
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



export async function getRemittances(
  params = {}
) {
  try {
    const response = await api.get(
      "/remittances",
      { params }
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


export async function farePaymentCallback(
  data
) {
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



export default api;
