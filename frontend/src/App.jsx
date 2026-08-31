import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth, AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";

import { AppShell } from "./components/layout/AppShell.jsx";

import DashboardPage from "./pages/owner/DashboardPage.jsx";
import VehicleDetailPage from "./pages/owner/VehicleDetailPage.jsx";
import FleetPage from "./pages/owner/FleetPage.jsx";
import SettingsPage from "./pages/owner/SettingsPage.jsx";
import DriversPage from "./pages/owner/DriversPage.jsx";
import RemittanceTransactionsPage from "./pages/owner/RemittanceTransactionsPage.jsx";

import RemmitancePage from "./pages/driver/RemittancePage.jsx";
import DriverRemittanceHistoryPage from "./pages/driver/RemittanceHistoryPage.jsx";
import DriverSettingsPage from "./pages/driver/SettingsPage.jsx";

import RemittanceHistoryPage from "./pages/RemittanceHistoryPage.jsx";

function DriverNotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "Payment received",
      message: "Customer paid KES 500.",
      amount: "KES 500",
      phone: "0712••4584",
      time: "23:06",
    },
    {
      id: 2,
      title: "Payment received",
      message: "Customer paid KES 150.",
      amount: "KES 150",
      phone: "0701••6226",
      time: "22:49",
    },
    {
      id: 3,
      title: "Daily remittance sent",
      message: "KES 4,500 was sent to the owner.",
      amount: "KES 4,500",
      phone: "",
      time: "21:14",
    },
    {
      id: 4,
      title: "Vehicle assigned",
      message: "KDJ 421A has been assigned to you.",
      amount: "KDJ 421A",
      phone: "Toyota Hiace",
      time: "18:14",
    },
    {
      id: 5,
      title: "Payment received",
      message: "Customer paid KES 300.",
      amount: "KES 300",
      phone: "0798••1045",
      time: "17:14",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#16A34A]">
              Driver
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#0F2440] dark:text-white">
              All Notifications
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your recent FleetPesa activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F2440] shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            Back
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="border-b border-slate-100 p-5 last:border-b-0 dark:border-slate-800"
            >
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#16A34A] dark:bg-emerald-950">
                  🔔
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-bold text-[#0F2440] dark:text-white">
                      {notification.title}
                    </h2>

                    <span className="shrink-0 text-xs text-slate-400">
                      {notification.time}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {notification.message}
                  </p>

                  {notification.amount && (
                    <div className="mt-3 inline-flex items-center rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-[#0F2440] dark:bg-slate-800 dark:text-white">
                      {notification.amount}
                    </div>
                  )}

                  {notification.phone && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {notification.phone}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <NotificationProvider>
              <Routes>

                <Route path="/" element={<LandingPage />} />

                {/* PUBLIC ROUTES */}

                <Route
                  path="/login"
                  element={<LoginPage />}
                />

                <Route
                  path="/signup"
                  element={<SignupPage />}
                />

                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />

                {/* OWNER ROUTES */}

                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="dashboard"
                    element={<DashboardPage />}
                  />

                  <Route
                    path="drivers"
                    element={<DriversPage />}
                  />

                  <Route
                    path="fleet"
                    element={<FleetPage />}
                  />

                  <Route
                    path="vehicles/:id"
                    element={<VehicleDetailPage />}
                  />

                  <Route
                    path="settings"
                    element={<SettingsPage />}
                  />

                  <Route
                    path="remittance-transactions"
                    element={<RemittanceTransactionsPage />}
                  />
                </Route>

                {/* DRIVER REMITTANCE */}

                <Route
                  path="/driver/remittance"
                  element={
                    <ProtectedRoute>
                      <RemmitancePage />
                    </ProtectedRoute>
                  }
                />

                {/* DRIVER REMITTANCE HISTORY */}

                <Route
                  path="/driver/remittance-history"
                  element={
                    <ProtectedRoute>
                      <DriverRemittanceHistoryPage />
                    </ProtectedRoute>
                  }
                />

                {/* DRIVER NOTIFICATIONS */}

                <Route
                  path="/driver/notifications"
                  element={
                    <ProtectedRoute>
                      <DriverNotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* DRIVER SETTINGS */}

                <Route
                  path="/driver/settings"
                  element={
                    <ProtectedRoute>
                      <DriverSettingsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/driver/remittance/settings"
                  element={
                    <ProtectedRoute>
                      <DriverSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* VEHICLE REMITTANCE HISTORY */}

                <Route
                  path="/vehicles/:vehicleId/remittances"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={<RemittanceHistoryPage />}
                  />
                </Route>

                {/* DEFAULT DASHBOARD */}

                <Route
                  path="/dashboard"
                  element={
                    <Navigate
                      to="/owner/dashboard"
                      replace
                    />
                  }
                />

                {/* UNKNOWN ROUTES */}

                <Route
                  path="*"
                  element={
                    <Navigate
                      to="/login"
                      replace
                    />
                  }
                />

              </Routes>
            </NotificationProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
