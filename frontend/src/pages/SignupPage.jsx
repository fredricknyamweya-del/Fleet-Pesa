import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { register } from "../lib/api.js";

import { useTheme } from "../context/ThemeContext.jsx";

function normalizePhone(value) {
  return value.replace(/\s/g, "");
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [role, setRole] = useState("owner");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  function validate() {
    if (!username.trim()) {
      return "Username is required";
    }

    if (!name.trim()) {
      return "Enter your full name";
    }

    const cleanPhone = normalizePhone(phone);

    if (!/^0[17]\d{8}$/.test(cleanPhone)) {
       return "Enter a valid Kenyan phone number, e.g. 0712345678 or 0112345678";
    }


    if (!password) {
      return "Password is required";
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(password)) {
      return "Password must be at least 8 characters and include letters, numbers, and special characters.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const cleanPhone = normalizePhone(phone);

      await register({
        username: username.trim(),
        name: name.trim(),
        phone: cleanPhone,
        password,
        role,
      });

      setCreated(true);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`login-page min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 ${
        isDark ? "login-page-dark" : "login-page-light"
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
          isDark ? "bg-slate-900 border border-slate-700" : "bg-white"
        }`}
      >
        {created ? (
          <div className="text-center py-8" role="status">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-green-50 text-3xl text-green-600">✓</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Account created successfully</h1>
            <p className="text-slate-500 mb-6">Your FleetPesa account is ready. Sign in to continue.</p>
            <button type="button" onClick={() => navigate("/login", { state: { success: "Account created. You can now sign in." } })} className="auth-primary-button w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors">Continue to Sign In</button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Create your account
              </h1>

              <p className="text-slate-500 mb-6">
                {role === "driver"
                  ? "Register to manage your daily remittance"
                  : "Register to manage your fleet"}
              </p>
            </div>

            {/* ROLE */}
            <div
              className="flex bg-slate-100 rounded-lg p-1 mb-6"
              role="tablist"
              aria-label="Account type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={role === "owner"}
                onClick={() => {
                  setRole("owner");
                  setError("");
                }}
                className={`auth-role-tab flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${role === "owner" ? "selected" : ""}`}
              >
                Fleet Owner
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={role === "driver"}
                onClick={() => {
                  setRole("driver");
                  setError("");
                }}
                className={`auth-role-tab flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${role === "driver" ? "selected" : ""}`}
              >
                Driver
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* USERNAME */}
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900 disabled:opacity-60"
                />
              </div>

              {/* NAME */}
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900 disabled:opacity-60"
                />
              </div>

              {/* PHONE */}
              <div className="mb-4">
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setError("");
                  }}
                  placeholder="0798765432"
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900 disabled:opacity-60"
                />
              </div>

              {/* PASSWORD */}
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setError("");
                }}
                visible={showPassword}
                onToggle={() =>
                  setShowPassword((visible) => !visible)
                }
                disabled={loading}
              />

              {/* CONFIRM PASSWORD */}
              <PasswordField
                id="confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);
                  setError("");
                }}
                visible={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword((visible) => !visible)
                }
                disabled={loading}
              />

              {/* ERROR */}
              {error && (
                <div
                  className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="auth-primary-button w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {loading ? "Creating account..." : "Create Account"}
              </button>

              <div
                className={`trust-line mt-4 flex items-center justify-center gap-2 text-center text-sm font-medium ${
                  isDark ? "text-slate-300" : "text-slate-900"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
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

                <span aria-hidden="true">•</span>

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

                <span aria-hidden="true">•</span>

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

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-slate-900 hover:underline"
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
}) {
  return (
    <div className="mb-2">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-11 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 disabled:opacity-50"
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {visible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

