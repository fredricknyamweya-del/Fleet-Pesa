import {
  Bell,
  Car,
  CheckCircle2,
  Send,
  Wallet,
} from "lucide-react";

import { MOCK_DRIVER_NOTIFICATIONS } from "../../data/mockNotifications.js";

function currency(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

function iconFor(type) {
  switch (type) {
    case "customer_payment_received":
      return <Wallet size={18} />;

    case "daily_remittance_sent":
      return <Send size={18} />;

    case "vehicle_assigned":
      return <Car size={18} />;

    default:
      return <Bell size={18} />;
  }
}

export default function DriverPaymentNotifications() {
  // Keep all notification types.
  const notifications = MOCK_DRIVER_NOTIFICATIONS;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#16A34A]">
            Driver
          </p>

          <h2 className="mt-1 text-lg font-bold text-[#0F2440]">
            Notifications
          </h2>
        </div>

        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-[#16A34A]">
          <Bell size={18} />
        </div>

      </div>

      {/* Notification list */}
      <div className="mt-4 divide-y divide-slate-100">

        {notifications.slice(0, 5).map((item) => (

          <div
            key={item.id}
            className={`flex gap-3 py-4 ${
              !item.is_read ? "bg-emerald-50/40" : ""
            }`}
          >

            {/* Notification icon */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#1E3A5F]">
              {iconFor(item.type)}
            </div>

            {/* Notification content */}
            <div className="min-w-0 flex-1">

              {/* Title and unread indicator */}
              <div className="flex items-start justify-between gap-3">

                <p className="text-sm font-bold text-[#0F2440]">
                  {item.title}
                </p>

                {!item.is_read && (
                  <span className="size-2 shrink-0 rounded-full bg-[#16A34A]" />
                )}

              </div>

              {/* Message */}
              <p className="mt-1 text-sm text-slate-500">
                {item.message}
              </p>

              {/* Customer payment */}
              {item.type === "customer_payment_received" && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">

                  {item.amount != null && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                      {currency(item.amount)}
                    </span>
                  )}

                  {item.customer_phone && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                      {item.customer_phone}
                    </span>
                  )}

                </div>
              )}

              {/* Vehicle assignment */}
              {item.type === "vehicle_assigned" && (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#1E3A5F]">
                  <Car size={14} />

                  {item.vehicle_registration}

                  {item.vehicle_model
                    ? ` · ${item.vehicle_model}`
                    : ""}
                </p>
              )}

              {/* Daily remittance */}
              {item.type === "daily_remittance_sent" && (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} />

                  {currency(item.amount)} sent to owner
                </p>
              )}

              {/* Notification time */}
              <p className="mt-2 text-[11px] text-slate-400">
                {new Date(item.created_at).toLocaleString(
                  "en-KE",
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )}
              </p>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}
