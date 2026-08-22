import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Eye, EyeOff, Loader2 } from "lucide-react";
import { register } from "../lib/api.js";

function normalizePhone(value) {
  return value.replace(/\s/g, "");
}

export default function SignupPage() {
  const navigate = useNavigate();
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

  const validate = () => {
    if (username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    if (!name.trim()) {
      return "Enter your full name";
    }
    if (!/^07\d{8}$/.test(normalizePhone(phone))) {
      return "Enter a valid phone number, e.g. 0708419329";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    try {
      await register({
        role,
        username: username.trim(),
        name: name.trim(),
        phone: normalizePhone(phone),
        password,
        confirmPassword: confirmPassword,
      });
      navigate("/login", {
        state: { success: "Account created. You can now sign in." },
      });
    } catch (requestError) {
      setError(requestError?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center">
          <Truck className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-xl font-bold text-slate-900">FleetPesa</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 mb-6">Register to manage your fleet</p>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={role === "owner"}
            onClick={() => setRole("owner")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              role === "owner" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            }`}
          >
            Fleet Owner
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "driver"}
            onClick={() => setRole("driver")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              role === "driver" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            }`}
          >
            Driver
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="username" className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0798765432"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mb-2">
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <button type="button" onClick={() => navigate("/login")} className="font-semibold text-slate-900 hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
