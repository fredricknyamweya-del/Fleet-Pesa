import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { login } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export function normalizePhone(value) {
  return String(value || "").replace(/\s/g, "");
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

  

  useEffect(() => {
    if (!success) return;

    const timeoutId = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [success]);

  
  useEffect(() => {
    if (!location.state?.success) return;

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [
    location.pathname,
    location.state?.success,
    navigate,
  ]);


  const validate = () => {
    const cleanPhone = normalizePhone(phone);

    if (!/^(07|01)\d{8}$/.test(cleanPhone)) {
      return "Phone number must be 10 digits and start with 07 or 01.";
    }

    if (!password) {
      return "Please enter your password.";
    }

    if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
        password
      )
    ) {
      return "Password must be at least 8 characters and include letters, numbers, and special characters.";
    }

    return "";
  };

  

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
  };

 

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const cleanPhone = normalizePhone(phone);

    const credentials = {
      phone: cleanPhone,
      password,
      role,
    };

    try {
      const responseData = await login(credentials);

      const authenticatedUser = responseData?.user;

      if (!authenticatedUser) {
        throw new Error(
          "Login succeeded, but the server did not return user information."
        );
      }
      setAuth({
        user: authenticatedUser,
      });

      const authenticatedRole = String(
        authenticatedUser.role || role
      ).toLowerCase();

    
      setPassword("");


      if (authenticatedRole === "driver") {
        navigate("/driver/remittance", {
          replace: true,
        });

        return;
      }

      if (authenticatedRole === "owner") {
        navigate("/owner/dashboard", {
          replace: true,
        });

        return;
      }

     
      setAuth(null);

      setError(
        "Your account has an unsupported account type."
      );
    } catch (err) {
      console.error("[LOGIN ERROR]", err);
      setError(
        err?.message ||
          "Sign in failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`login-page min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 ${
        isDark
          ? "login-page-dark"
          : "login-page-light"
      }`}
    >
      

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

      <div
        className={`login-card w-full max-w-md rounded-2xl p-8 ${
          isDark
            ? "border border-slate-700 bg-slate-900"
            : "bg-white"
        }`}
      >

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
            disabled={loading}
            className={`auth-role-tab flex-1 rounded-md py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              role === "owner" ? "selected" : ""
            }`}
          >
            Fleet Owner
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={role === "driver"}
            onClick={() => handleRoleChange("driver")}
            disabled={loading}
            className={`auth-role-tab flex-1 rounded-md py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              role === "driver" ? "selected" : ""
            }`}
          >
            Driver
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="phone"
              className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${
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
              onChange={(event) => {
                setPhone(event.target.value);
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
          <div className="mb-2">
            <label
              htmlFor="password"
              className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${
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
                onChange={(event) => {
                  setPassword(event.target.value);
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
            disabled={loading}
          >
            Forgot password?
          </button>
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
          <button
            type="submit"
            disabled={loading}
            className="auth-primary-button mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
          <div
            className={`trust-line mt-4 flex items-center justify-center gap-2 text-center text-sm font-medium ${
              isDark
                ? "text-slate-300"
                : "text-slate-900"
            }`}
            style={{
              fontFamily: "Inter, sans-serif",
            }}
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                ✓
              </span>
              Secure
            </span>

            <span aria-hidden="true">
              •
            </span>

            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                ✓
              </span>
              Instant M-Pesa
            </span>

            <span aria-hidden="true">
              •
            </span>

            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#16A34A] text-white">
                ✓
              </span>
              Built for Kenyan fleets
            </span>
          </div>
        </form>
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
            onClick={() => navigate("/signup")}
            disabled={loading}
            className={`font-semibold hover:underline disabled:opacity-50 ${
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
