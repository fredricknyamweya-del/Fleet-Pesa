import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { login } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export function normalizePhone(value) {
  return value.replace(/\s/g, "");
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { setAuth } = useAuth();
  const { isDark } = useTheme();

  const [role, setRole] = useState("owner");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(
    location.state?.success || ""
  );


  // SUCCESS MESSAGE

  useEffect(() => {
    if (!success) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [success]);

  // Remove navigation state after reading it
  useEffect(() => {
    if (location.state?.success) {
      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [location, navigate]);

  // VALIDATION

  const validate = () => {
    const cleanPhone = normalizePhone(phone);

    if (!/^(07|01)\d{8}$/.test(cleanPhone)) {
         return "Phone number must be 10 digits and start with 07 or 01.";
    }


    if (!password) {
      return "Please enter your password";
    }

    if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(password)
    ) {
      return "Password must be at least 8 characters and include letters, numbers, and special characters.";
    }

    return "";
  };

  // ROLE

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
  };

  // LOGIN

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    const cleanPhone = normalizePhone(phone);

    try {
      
      const response = await login({
        phone: cleanPhone,
        password,
        role,
      });

      console.log("Login response:", response);

      

      const token = response?.access_token || response?.token ||
        response?.data?.access_token || response?.data?.token;

      const user = response?.user || response?.data?.user ||
        null;

      if (!token) {
        throw new Error("Login succeeded but the backend did not return an authentication token.");
      }

      
      setAuth({token,
        user:
          user || {
            phone: cleanPhone,
            role,
          },
      });

      // REDIRECT

      if (role === "driver") {
        navigate("/driver/remittance", {
          replace: true,
        });
      } else {
        navigate("/owner/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      console.error("Login error:", err);

      
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message ||
        "Sign in failed. Check your details and try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // UI

  return (
    <div
      className={`login-page min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 ${
        isDark
          ? "login-page-dark"
          : "login-page-light"
      }`}
    >
      {/* ======================================================
          LOGO
      ====================================================== */}

      <div
        className={`login-logo-frame mb-8 rounded-[22px] p-1.5 shadow-[0_6px_16px_rgba(16,40,68,0.08)] ring-1 ${
          isDark
            ? "login-logo-frame-dark ring-slate-700/60"
            : "login-logo-frame-light ring-slate-200/60"
        }`}
      >
        <img
          src={
            isDark
              ? "/Fleet-pesa%20Logo%20Light.jpg"
              : "/Fleet-pesa%20Logo%20Dark.jpg"
          }
          alt="FleetPesa"
          className="h-auto w-56 max-w-full rounded-[16px] object-contain"
        />
      </div>

      {/* ======================================================
          LOGIN CARD
      ====================================================== */}

      <div
        className={`login-card w-full max-w-md rounded-2xl p-8 ${
          isDark
            ? "bg-slate-900 border border-slate-700"
            : "bg-white"
        }`}
      >
        {/* ====================================================
            HEADING
        ==================================================== */}

        <div className="text-center">
          <h1
            className={`mb-1 text-2xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Welcome back
          </h1>

          <p
            className={`mb-6 ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {role === "driver"
              ? "Sign in to your remittance dashboard"
              : "Sign in to your fleet dashboard"}
          </p>
        </div>

        {/* ====================================================
            SUCCESS MESSAGE
        ==================================================== */}

        {success && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              isDark
                ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                : "border-emerald-200 bg-emerald-50 text-emerald-600"
            }`}
            role="status"
          >
            {success}
          </div>
        )}

        {/* ====================================================
            ROLE SELECTOR
        ==================================================== */}

        <div
          className={`mb-6 flex rounded-lg p-1 ${
            isDark
              ? "bg-slate-800"
              : "bg-slate-100"
          }`}
          role="tablist"
          aria-label="Account type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === "owner"}
            onClick={() => handleRoleChange("owner")}
            className={`auth-role-tab flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              role === "owner"
                ? "selected"
                : ""
            }`}
          >
            Fleet Owner
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={role === "driver"}
            onClick={() => handleRoleChange("driver")}
            className={`auth-role-tab flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              role === "driver"
                ? "selected"
                : ""
            }`}
          >
            Driver
          </button>
        </div>

        {/* ====================================================
            FORM
        ==================================================== */}

        <form onSubmit={handleSubmit} noValidate>
          {/* ==================================================
              PHONE
          ================================================== */}

          <div className="mb-4">
            <label
              htmlFor="phone"
              className={`mb-1.5 block text-xs font-semibold tracking-wide uppercase ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
              placeholder="0712345678"
              disabled={loading}
              className={`w-full rounded-lg border px-4 py-2.5 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-500 focus:ring-slate-700"
                  : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-slate-300"
              }`}
            />
          </div>

          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div className="mb-2">
            <label
              htmlFor="password"
              className={`mb-1.5 block text-xs font-semibold tracking-wide uppercase ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2.5 pr-11 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-500 focus:ring-slate-700"
                    : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-slate-300"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                disabled={loading}
                className={`absolute inset-y-0 right-0 flex items-center pr-3 transition-colors disabled:opacity-50 ${
                  isDark
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* ==================================================
              FORGOT PASSWORD
          ================================================== */}

          <button
            type="button"
            className={`forgot-password text-sm font-medium transition-colors ${
              isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() =>
              navigate("/forgot-password")
            }
          >
            Forgot password?
          </button>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                isDark
                  ? "border-red-900 bg-red-950/40 text-red-400"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* ==================================================
              SUBMIT
          ================================================== */}

          <button
            type="submit"
            disabled={loading}
            className="auth-primary-button w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

          {/* ==================================================
              TRUST LINE
          ================================================== */}

          <div
            className={`trust-line mt-4 flex items-center justify-center gap-2 text-center text-sm font-medium ${
              isDark
                ? "text-slate-300"
                : "text-slate-900"
            }`}
            style={{
              fontFamily:
                "Inter, sans-serif",
            }}
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                <svg
                  viewBox="0 0 20 20"
                  className="h-2.5 w-2.5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5.5 10.5L8.5 13.5L14.5 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Secure
            </span>

            <span aria-hidden="true">
              •
            </span>

            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                <svg
                  viewBox="0 0 20 20"
                  className="h-2.5 w-2.5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5.5 10.5L8.5 13.5L14.5 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Instant M-Pesa
            </span>

            <span aria-hidden="true">
              •
            </span>

            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                <svg
                  viewBox="0 0 20 20"
                  className="h-2.5 w-2.5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5.5 10.5L8.5 13.5L14.5 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Built for Kenyan fleets
            </span>
          </div>
        </form>

        {/* ====================================================
            SIGN UP
        ==================================================== */}

        <p
          className={`mt-6 text-center text-sm ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          No account yet?{" "}
          <button
            type="button"
            onClick={() =>
              navigate("/signup")
            }
            className={`font-semibold hover:underline ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}


