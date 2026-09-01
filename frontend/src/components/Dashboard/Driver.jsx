import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Moon,
  Phone,
  Settings,
  Sun,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { MOCK_VEHICLES } from "../../data/mockVehicles.js";

import StatusBadge from "../shared/StatusBadge.jsx";
import { StatCard } from "../shared/StatCard";
import Avatar from "../shared/Avatar.jsx";
import AlertBanner from "../shared/AlertBanner.jsx";

import FarePaymentModal from "../../features/paymentPrompt/FarePaymentModal.jsx";
import DriverPaymentNotifications from "../../components/notifications/DriverPaymentNotifications.jsx";

export default function Driver() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [successMessage, setSuccessMessage] = useState(
    location.state?.success || ""
  );

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle");

  const [paymentPhone, setPaymentPhone] = useState(
    user?.phone || "0712345678"
  );

  const [showFarePaymentModal, setShowFarePaymentModal] =
    useState(false);

  
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notificationCount, setNotificationCount] =
    useState(3);

  const [vehicles, setVehicles] = useState(() => {
    try {
      const stored = localStorage.getItem("fleetpesa_mock_vehicles");
      return stored ? JSON.parse(stored) : MOCK_VEHICLES;
    } catch {
      return MOCK_VEHICLES;
    }
  });
  const [startedVehicleId, setStartedVehicleId] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("fleetpesa_driver_day_start") || "null",
      );
      return stored?.date === new Date().toISOString().slice(0, 10)
        ? stored.vehicleId
        : "";
    } catch {
      return "";
    }
  });

  const quickAmounts = [1500, 3000, 4500];

  const assignedVehicles = useMemo(() => {
    const driverName = user?.name || "Peter Omondi";
    return vehicles.filter((vehicle) => vehicle.driver_name === driverName);
  }, [user?.name, vehicles]);

  const startedVehicle = assignedVehicles.find(
    (vehicle) => vehicle.id === startedVehicleId,
  ) || assignedVehicles[0];

  function handleActivateVehicle() {
    if (!startedVehicle || startedVehicle.status !== "parked") {
      return;
    }

    const activatedVehicle = {
      ...startedVehicle,
      status: "active",
    };
    const updatedVehicles = vehicles.map((vehicle) =>
      vehicle.id === activatedVehicle.id ? activatedVehicle : vehicle,
    );

    setVehicles(updatedVehicles);
    localStorage.setItem(
      "fleetpesa_mock_vehicles",
      JSON.stringify(updatedVehicles),
    );
    localStorage.setItem(
      "fleetpesa_driver_day_start",
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        vehicleId: activatedVehicle.id,
        driverName: user?.name || "Peter Omondi",
      }),
    );
  }

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  function handleAmountChange(event) {
    const newAmount = event.target.value.replace(/\D/g, "");
    setAmount(newAmount);
  }

  function handleQuickSelect(value) {
    setAmount(String(value));
  }

  const isAmountValid =
    /^\d+$/.test(amount) && Number(amount) > 0;

  function handleSubmit() {
    const cleanPhone = paymentPhone.replace(/\s/g, "");

    if (!/^07\d{8}$/.test(cleanPhone)) {
      return;
    }

    setStatus("processing");

    console.log(
      "Submitting daily remittance:",
      amount,
      "to:",
      cleanPhone
    );

    
    window.setTimeout(() => {
      setStatus("success");
    }, 1500);
  }

  function handleSubmitAnother() {
    setAmount("");
    setStatus("idle");
  }

  function handleSignOut() {
    logout();

    navigate("/login", {
      replace: true,
      state: {
        success: "Successfully signed out.",
      },
    });
  }

  function handleNotificationClick() {
    setShowNotifications((current) => !current);

    
    setNotificationCount(0);
  }

  

  if (status === "success") {
    return (
      <main className="success-shell">
        <section
          className="success-card"
          aria-labelledby="success-title"
        >
          <div
            className="success-icon"
            aria-hidden="true"
          >
            ✓
          </div>

          <h1
            className="success-title"
            id="success-title"
          >
            Payment Received!
          </h1>

          <p className="success-copy">
            Successfully remitted to owner
          </p>

          <p className="success-amount">
            KES {Number(amount).toLocaleString("en-KE")}
          </p>

          <div className="receipt-details">
            <div className="receipt-row">
              <span>Reference</span>
              <strong>FP-2026-001847</strong>
            </div>

            <div className="receipt-row">
              <span>M-Pesa Code</span>
              <strong>QHF72JK48N</strong>
            </div>

            <div className="receipt-row">
              <span>Payment Number</span>
              <strong>{paymentPhone}</strong>
            </div>

            <div className="receipt-row">
              <span>Vehicle</span>
              <strong>KDJ 421A</strong>
            </div>

            <div className="receipt-row">
              <span>Recipient</span>
              <strong>FleetPesa Owner</strong>
            </div>
          </div>

          <button
            className="submit-another-button"
            type="button"
            onClick={handleSubmitAnother}
          >
            Submit Another
          </button>
        </section>
      </main>
    );
  }

  

  return (
    <div className="driver-page">

      

      {successMessage && (
        <p
          className="auth-success"
          role="status"
        >
          {successMessage}
        </p>
      )}

      

      <header className="driver-header">
        <div className="driver-header-inner">

         

          <div className="driver-brand-row">

            

            <div className="driver-brand">
              <img
                className="brand-logo driver-brand-logo"
                src="/FleetPesa%20FavIcon.jpg"
                alt="FleetPesa"
              />
            </div>

            

            <div className="driver-actions">

              

              <button
                className="driver-theme-toggle"
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${
                  isDark ? "light" : "dark"
                } mode`}
                title={`Switch to ${
                  isDark ? "light" : "dark"
                } mode`}
              >
                {isDark ? (
                  <Sun size={16} />
                ) : (
                  <Moon size={16} />
                )}
              </button>


              

              <button
                type="button"
                onClick={handleNotificationClick}
                className="driver-notification-trigger relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F2440] shadow-sm transition hover:bg-slate-50"
                aria-label="Open notifications"
                title="Notifications"
              >
                <Bell size={19} />

                {notificationCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                  >
                    {notificationCount > 9
                      ? "9+"
                      : notificationCount}
                  </span>
                )}
              </button>


              

              <button
                className="driver-theme-toggle"
                type="button"
                onClick={() => navigate("/driver/settings")}
                aria-label="Open settings"
                title="Settings"
              >
                <Settings size={16} />
              </button>

            </div>
          </div>


          

          {showNotifications && (
            <div className="relative z-50">

              <div className="absolute right-0 top-3 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

                

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#16A34A]">
                      Driver
                    </p>

                    <h2 className="text-lg font-bold text-[#0F2440]">
                      Notifications
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowNotifications(false)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close notifications"
                  >
                    <X size={18} />
                  </button>

                </div>


               

                <div className="max-h-[480px] overflow-y-auto">

                  <DriverPaymentNotifications />

                </div>


                

                <div className="border-t border-slate-100 p-3">

                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/driver/notifications");
                    }}
                    className="w-full rounded-xl bg-[#0F2440] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
                  >
                    View all notifications
                  </button>

                </div>

              </div>

            </div>
          )}

        </div>


        

        <div className="driver-profile">

          <p className="driver-label">
            Daily remittance for
          </p>

          <div className="driver-profile-row">

            <Avatar
              name={user?.name || "Peter Omondi"}
              image={user?.profile_picture}
            />

            <div>

              <h1 className="driver-name">
                {user?.name || "Peter Omondi"}
              </h1>

              <p className="driver-vehicle">
                KDJ 421A · Toyota Hiace
              </p>

            </div>

          </div>

        </div>

      </header>


      

      <main className="driver-content">

       

        <AlertBanner
          title="Remittance shortfall"
          message="You have KES 1500 remaining for today's target."
          type="warning"
        />


        

        <section className="driver-start-card" aria-labelledby="start-day-title">
          <div>
            <p className="driver-label" id="start-day-title">
              {startedVehicle?.status === "parked"
                ? "Vehicle selected"
                : "Vehicle started today"}
            </p>
            <p className="driver-start-copy">
              {startedVehicle
                ? `${startedVehicle.plate_number} · ${startedVehicle.type}${startedVehicle.status === "parked" ? " · Parked" : ""}`
                : "Log the vehicle you started the day with."}
            </p>
          </div>

          {startedVehicle?.status === "parked" && (
            <button
              className="driver-activate-button"
              type="button"
              onClick={handleActivateVehicle}
            >
              Activate vehicle
            </button>
          )}
        </section>

        <section className="amount-card">

          <label
            className="driver-label"
            htmlFor="amount"
          >
            Amount to submit
          </label>

          <div className="amount-input-row">

            <span className="currency-prefix">
              KES
            </span>

            <input
              className="amount-input"
              id="amount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0"
              aria-describedby="amount-help"
            />

          </div>


          <div className="expected-row">

            <span>
              Expected today
            </span>

            <strong className="expected-amount">
              KES 4,500
            </strong>

          </div>


          <p
            className="amount-help"
            id="amount-help"
          >
            Enter the amount you are remitting to the
            owner in Kenyan shillings.
          </p>


          <StatCard
            label="Expected today"
            value="KES 4500"
          />

        </section>


        

        <section
          className="quick-section"
          aria-labelledby="quick-select-title"
        >

          <h2
            className="driver-label"
            id="quick-select-title"
          >
            Quick select
          </h2>

          <div className="quick-grid">

            {quickAmounts.map((value) => (
              <button
                className={`quick-button ${
                  Number(amount) === value
                    ? "quick-button-active"
                    : ""
                }`}
                key={value}
                type="button"
                aria-pressed={
                  Number(amount) === value
                }
                onClick={() =>
                  handleQuickSelect(value)
                }
              >
                {value.toLocaleString("en-KE")}
              </button>
            ))}

          </div>

        </section>


        

        <section
          className="payment-card"
          aria-label="Payment method"
        >

          <div className="payment-details">

            <span
              className="payment-icon"
              aria-hidden="true"
            >
              <Phone
                size={18}
                strokeWidth={2}
              />
            </span>

            <div>

              <h2 className="payment-name">
                M-Pesa
              </h2>

              <label
                className="payment-phone-label"
                htmlFor="payment-phone"
              >
                Payment number
              </label>

              <input
                className="payment-phone-input"
                id="payment-phone"
                type="tel"
                inputMode="tel"
                value={paymentPhone}
                onChange={(event) =>
                  setPaymentPhone(
                    event.target.value
                  )
                }
                aria-label="M-Pesa payment number"
              />

            </div>

          </div>

          <StatusBadge status="Ready" />

        </section>


        

        <button
          className={`submit-button ${
            status === "processing"
              ? "submit-button-processing"
              : ""
          }`}
          type="button"
          onClick={handleSubmit}
          disabled={
            !isAmountValid ||
            !/^07\d{8}$/.test(
              paymentPhone.replace(/\s/g, "")
            ) ||
            status === "processing"
          }
        >
          {status === "processing"
            ? "Processing..."
            : isAmountValid
              ? `Submit KES ${Number(
                  amount
                ).toLocaleString("en-KE")}`
              : "Enter an amount"}
        </button>


        

        <button
          className="w-full rounded-2xl border-0 bg-[#16A34A] px-5 py-4 text-base font-bold text-white transition hover:bg-[#15803D] focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          type="button"
          onClick={() =>
            setShowFarePaymentModal(true)
          }
        >
          Prompt Fare Payment
        </button>

      </main>


      

      {showFarePaymentModal && (
        <FarePaymentModal
          onClose={() =>
            setShowFarePaymentModal(false)
          }
        />
      )}

    </div>
  );
}