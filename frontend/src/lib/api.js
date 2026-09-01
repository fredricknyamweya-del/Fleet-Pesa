// const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// /**
//  * Core fetch wrapper — handles JSON headers, auth token, and error parsing.
//  * Throws an Error with a readable message on non-2xx responses.
//  */
// async function request(path, { method = "GET", body, auth = true } = {}) {
//   const headers = { "Content-Type": "application/json" };

//   if (auth) {
//     const token = localStorage.getItem("fleetpesa_token");
//     if (token) headers.Authorization = `Bearer ${token}`;
//   }

//   let response;
//   try {
//     response = await fetch(`${BASE_URL}${path}`, {
//       method,
//       headers,
//       body: body ? JSON.stringify(body) : undefined,
//     });
//   } catch (networkErr) {
//     throw new Error("Network error — check your connection and try again.");
//   }

//   let data = null;
//   const text = await response.text();
//   if (text) {
//     try {
//       data = JSON.parse(text);
//     } catch {
//       data = null;
//     }
//   }

//   if (!response.ok) {
//     const message = data?.message || data?.error || `Request failed (${response.status})`;
//     throw new Error(message);
//   }

//   return data;
// }

// // ---- Auth ----

// export function login({ role, phone, password }) {
//   return request("/auth/login", {
//     method: "POST",
//     body: { role, phone, password },
//     auth: false,
//   });
// }

// export function register({ role, username, name, phone, password }) {
//   return request("/auth/register", {
//     method: "POST",
//     body: { role, username, name, phone, password },
//     auth: false,
//   });
// }

// export function updateProfile({ name, phone, notification_preference }) {
//   const body = { name, phone };
//   if (notification_preference !== undefined) body.notification_preference = notification_preference;
//   return request("/users/me", { method: "PATCH", body });
// }

// export function updatePassword({ currentPassword, newPassword }) {
//   return request("/users/me/password", {
//     method: "PATCH",
//     body: { current_password: currentPassword, new_password: newPassword },
//   });
// }

// // Expected password recovery contract: the backend sends a six-digit OTP to phone.
// export function requestPasswordOtp({ phone }) {
//   return request("/auth/password/otp/request", {
//     method: "POST",
//     body: { phone },
//     auth: false,
//   });
// }

// export function verifyPasswordOtp({ phone, otp }) {
//   return request("/auth/password/otp/verify", {
//     method: "POST",
//     body: { phone, otp },
//     auth: false,
//   });
// }

// export function resetPassword({ phone, resetToken, password }) {
//   return request("/auth/password/reset", {
//     method: "POST",
//     body: { phone, reset_token: resetToken, password },
//     auth: false,
//   });
// }

// // Frontend-only mock for remittance shortfall updates until the backend exposes this endpoint.
// export function updateRemittance(remittanceId, updates = {}) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({
//         id: remittanceId,
//         ...updates,
//         updated_at: new Date().toISOString(),
//         status: "resolved",
//       });
//     }, 400);
//   });
// }

// export function getVehicle(vehicleId) {
//   return request(`/vehicles/${encodeURIComponent(vehicleId)}`);
// }

// export function listVehicles() {
//   return request("/vehicles");
// }

// export function listRemittances({ vehicleId, driverId } = {}) {
//   const params = new URLSearchParams();
//   if (vehicleId) params.set("vehicle_id", vehicleId);
//   if (driverId) params.set("driver_id", driverId);

//   const query = params.toString();
//   return request(`/remittances${query ? `?${query}` : ""}`);
// }

// export function getVehicleRemittanceHistory(vehicleId, filters = {}) {
//   const params = new URLSearchParams();
//   if (filters.from) params.set("from", filters.from);
//   if (filters.to) params.set("to", filters.to);
//   if (filters.status && filters.status !== "all") params.set("status", filters.status);
//   const query = params.toString();
//   return request(`/vehicles/${encodeURIComponent(vehicleId)}/remittances${query ? `?${query}` : ""}`);
// }

// export default {
//   login,
//   register,
//   requestPasswordOtp,
//   verifyPasswordOtp,
//   resetPassword,
//   updateRemittance,
//   getVehicle,
//   listVehicles,
//   listRemittances,
//   getVehicleRemittanceHistory,
// };


const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Core fetch wrapper.
 *
 * Handles:
 * - JSON headers
 * - authentication token
 * - JSON response parsing
 * - readable API errors
 */
async function request(
  path,
  { method = "GET", body, auth = true } = {},
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = localStorage.getItem("fleetpesa_token");

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      "Network error — check your connection and try again.",
    );
  }

  let data = null;

  const text = await response.text();

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   AUTH
========================================================= */

export function login({ role, phone, password }) {
  return request("/auth/login", {
    method: "POST",
    body: {
      role,
      phone,
      password,
    },
    auth: false,
  });
}

export function register({
  role,
  username,
  name,
  phone,
  password,
}) {
  return request("/auth/register", {
    method: "POST",
    body: {
      role,
      username,
      name,
      phone,
      password,
    },
    auth: false,
  });
}

export function updateProfile({
  name,
  phone,
  notification_preference,
}) {
  const body = {
    name,
    phone,
  };

  if (notification_preference !== undefined) {
    body.notification_preference =
      notification_preference;
  }

  return request("/users/me", {
    method: "PATCH",
    body,
  });
}

export function updatePassword({
  currentPassword,
  newPassword,
}) {
  return request("/users/me/password", {
    method: "PATCH",
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

/* =========================================================
   PASSWORD RECOVERY
========================================================= */

export function requestPasswordOtp({ phone }) {
  return request("/auth/password/otp/request", {
    method: "POST",
    body: {
      phone,
    },
    auth: false,
  });
}

export function verifyPasswordOtp({ phone, otp }) {
  return request("/auth/password/otp/verify", {
    method: "POST",
    body: {
      phone,
      otp,
    },
    auth: false,
  });
}

export function resetPassword({
  phone,
  resetToken,
  password,
}) {
  return request("/auth/password/reset", {
    method: "POST",
    body: {
      phone,
      reset_token: resetToken,
      password,
    },
    auth: false,
  });
}

/* =========================================================
   VEHICLES
========================================================= */

export function getVehicle(vehicleId) {
  return request(
    `/vehicles/${encodeURIComponent(vehicleId)}`,
  );
}

export function listVehicles() {
  return request("/vehicles");
}

/**
 * Owner assigns a driver to a vehicle.
 *
 * This should trigger a notification for the driver.
 */
export function assignVehicleToDriver({
  vehicleId,
  driverId,
}) {
  return request(
    `/vehicles/${encodeURIComponent(vehicleId)}/assign`,
    {
      method: "PATCH",
      body: {
        driver_id: driverId,
      },
    },
  );
}

/**
 * Owner removes the current driver from a vehicle.
 */
export function unassignVehicleFromDriver(vehicleId) {
  return request(
    `/vehicles/${encodeURIComponent(vehicleId)}/assign`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Get vehicles assigned to the currently authenticated driver.
 */
export function listMyVehicles() {
  return request("/drivers/me/vehicles");
}

/**
 * Get the current driver's assigned vehicle.
 */
export function getMyVehicle() {
  return request("/drivers/me/vehicle");
}

/* =========================================================
   REMITTANCES
========================================================= */

export function listRemittances({
  vehicleId,
  driverId,
} = {}) {
  const params = new URLSearchParams();

  if (vehicleId) {
    params.set("vehicle_id", vehicleId);
  }

  if (driverId) {
    params.set("driver_id", driverId);
  }

  const query = params.toString();

  return request(
    `/remittances${query ? `?${query}` : ""}`,
  );
}

export function getVehicleRemittanceHistory(
  vehicleId,
  filters = {},
) {
  const params = new URLSearchParams();

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (
    filters.status &&
    filters.status !== "all"
  ) {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return request(
    `/vehicles/${encodeURIComponent(
      vehicleId,
    )}/remittances${query ? `?${query}` : ""}`,
  );
}

/**
 * Driver submits daily remittance to owner.
 *
 * Example:
 *
 * submitDailyRemittance({
 *   vehicleId: "vehicle-1",
 *   amount: 8500
 * })
 *
 * Backend should:
 * 1. record the remittance
 * 2. associate it with driver + vehicle
 * 3. notify owner
 */
export function submitDailyRemittance({
  vehicleId,
  amount,
}) {
  return request("/remittances", {
    method: "POST",
    body: {
      vehicle_id: vehicleId,
      amount: Number(amount),
    },
  });
}

/**
 * Driver's own remittance history.
 */
export function listMyRemittances() {
  return request("/drivers/me/remittances");
}

/**
 * Owner's remittances received today.
 */
export function listTodayRemittances() {
  return request("/remittances/today");
}

/**
 * Owner's complete remittance history.
 */
export function listOwnerRemittanceHistory(
  filters = {},
) {
  const params = new URLSearchParams();

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return request(
    `/owner/remittances${query ? `?${query}` : ""}`,
  );
}

/**
 * Existing frontend-only mock.
 *
 * Keep this until the backend exposes the endpoint.
 */
export function updateRemittance(
  remittanceId,
  updates = {},
) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: remittanceId,
        ...updates,
        updated_at: new Date().toISOString(),
        status: "resolved",
      });
    }, 400);
  });
}

/* =========================================================
   CUSTOMER M-PESA PAYMENTS
========================================================= */

/**
 * Send an M-Pesa STK Push to a customer.
 *
 * Driver enters:
 * - customer phone
 * - amount
 *
 * Customer receives the M-Pesa prompt.
 *
 * IMPORTANT:
 * This does NOT mean payment has succeeded yet.
 *
 * Payment success should come from the backend
 * after Safaricom confirms the transaction.
 */
export function createCustomerPrompt({
  phone,
  amount,
  vehicleId,
}) {
  return request("/payments/prompt", {
    method: "POST",
    body: {
      phone,
      amount: Number(amount),
      vehicle_id: vehicleId,
    },
  });
}

/**
 * Get customer's payment records for the current driver.
 */
export function listMyCustomerPayments() {
  return request("/drivers/me/customer-payments");
}

/**
 * Get today's customer collections for the driver.
 */
export function listTodayCustomerPayments() {
  return request("/drivers/me/customer-payments/today");
}

/**
 * Owner can see money collected across the fleet.
 */
export function listOwnerCustomerPayments(
  filters = {},
) {
  const params = new URLSearchParams();

  if (filters.vehicleId) {
    params.set(
      "vehicle_id",
      filters.vehicleId,
    );
  }

  if (filters.driverId) {
    params.set(
      "driver_id",
      filters.driverId,
    );
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  const query = params.toString();

  return request(
    `/owner/customer-payments${
      query ? `?${query}` : ""
    }`,
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

/**
 * Get notifications for the currently authenticated user.
 *
 * The backend decides whether the user is:
 * - owner
 * - driver
 *
 * Therefore we don't need separate owner/driver endpoints.
 */
export function listNotifications({
  limit = 20,
  unreadOnly = false,
} = {}) {
  const params = new URLSearchParams();

  params.set("limit", String(limit));

  if (unreadOnly) {
    params.set("unread", "true");
  }

  return request(
    `/notifications?${params.toString()}`,
  );
}

/**
 * Get only the unread notification count.
 *
 * Used by the bell:
 *
 * 🔔 5
 */
export function getUnreadNotificationCount() {
  return request("/notifications/unread-count");
}

/**
 * Mark one notification as read.
 */
export function markNotificationAsRead(
  notificationId,
) {
  return request(
    `/notifications/${encodeURIComponent(
      notificationId,
    )}/read`,
    {
      method: "PATCH",
    },
  );
}

/**
 * Mark every notification as read.
 */
export function markAllNotificationsAsRead() {
  return request("/notifications/read-all", {
    method: "PATCH",
  });
}

/**
 * Delete one notification if your backend supports it.
 */
export function deleteNotification(
  notificationId,
) {
  return request(
    `/notifications/${encodeURIComponent(
      notificationId,
    )}`,
    {
      method: "DELETE",
    },
  );
}

/* =========================================================
   NOTIFICATION HISTORY
========================================================= */

/**
 * Full notification history.
 *
 * Used by:
 *
 * /notifications
 */
export function getNotificationHistory({
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  return request(
    `/notifications/history?${params.toString()}`,
  );
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  /* Auth */
  login,
  register,
  updateProfile,
  updatePassword,

  /* Password */
  requestPasswordOtp,
  verifyPasswordOtp,
  resetPassword,

  /* Vehicles */
  getVehicle,
  listVehicles,
  assignVehicleToDriver,
  unassignVehicleFromDriver,
  listMyVehicles,
  getMyVehicle,

  /* Remittances */
  listRemittances,
  getVehicleRemittanceHistory,
  submitDailyRemittance,
  listMyRemittances,
  listTodayRemittances,
  listOwnerRemittanceHistory,
  updateRemittance,

  /* Customer payments */
  createCustomerPrompt,
  listMyCustomerPayments,
  listTodayCustomerPayments,
  listOwnerCustomerPayments,

  /* Notifications */
  listNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationHistory,
}