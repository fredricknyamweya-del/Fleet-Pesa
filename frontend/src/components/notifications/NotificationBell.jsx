import {
  Bell,
  Car,
  CheckCircle2,
  Send,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";



function formatDate(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function currency(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}



function isNotificationUnread(item) {
  if (!item) return false;

  if (typeof item.is_read === "boolean") {
    return item.is_read === false;
  }

  if (typeof item.read === "boolean") {
    return item.read === false;
  }

  return false;
}



function getDriverIcon(type) {
  switch (type) {
    case "customer_payment_received":
    case "customer_payment":
      return <Wallet size={18} />;

    case "daily_remittance_sent":
    case "remittance_sent":
      return <Send size={18} />;

    case "vehicle_assigned":
      return <Car size={18} />;

    default:
      return <Bell size={18} />;
  }
}


function getDefaultDriverTitle(type) {
  switch (type) {
    case "customer_payment_received":
    case "customer_payment":
      return "Customer payment received";

    case "vehicle_assigned":
      return "Vehicle assigned";

    case "daily_remittance_sent":
    case "remittance_sent":
      return "Daily remittance sent";

    default:
      return "Notification";
  }
}



function getDefaultDriverMessage(type, item) {
  switch (type) {
    case "customer_payment_received":
    case "customer_payment":
      return `Customer paid ${currency(item.amount)}.`;

    case "vehicle_assigned":
      return "A vehicle has been assigned to you.";

    case "daily_remittance_sent":
    case "remittance_sent":
      return `${currency(item.amount)} was sent to the owner.`;

    default:
      return "You have a new notification.";
  }
}



export default function NotificationBell({
  notifications = [],
  onOpen,
  role = "owner",
}) {
  const [open, setOpen] = useState(false);

  

  const navigate = useNavigate();

  

  const normalizedRole = String(role).trim().toLowerCase();

  const isOwner = normalizedRole === "owner";
  const isDriver = normalizedRole === "driver";

  

  const allNotifications = Array.isArray(notifications)
    ? notifications
    : [];

  

  const ownerNotifications = allNotifications.filter(
    (item) =>
      item?.type === "remittance_received" ||
      item?.type === "daily_remittance_received" ||
      item?.type === "shortfall" ||
      item?.type === "vehicle_assigned"
  );

  

  const driverNotifications = allNotifications.filter(
    (item) =>
      item?.type === "customer_payment_received" ||
      item?.type === "customer_payment" ||
      item?.type === "vehicle_assigned" ||
      item?.type === "daily_remittance_sent" ||
      item?.type === "remittance_sent"
  );

  

  const items = isOwner
    ? ownerNotifications
    : isDriver
      ? driverNotifications
      : [];

  

  const visibleUnreadCount = items.filter(
    (item) => isNotificationUnread(item)
  ).length;

  

  function handleOpen() {
    setOpen((current) => !current);

    if (!open && typeof onOpen === "function") {
      onOpen();
    }
  }

  function handleClose() {
    setOpen(false);
  }

  

  function handleViewAll() {
    setOpen(false);

    if (isOwner) {
      navigate("/owner/remittance-transactions");
      return;
    }

    if (isDriver) {
      navigate("/driver/notifications");
    }
  }

  

  return (
    <div className="relative">
      

      <button
        type="button"
        onClick={handleOpen}
        className="notification-trigger relative flex size-10 items-center justify-center rounded-full bg-white text-[#0F2440] shadow-sm transition hover:bg-slate-100"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={21} />

        {visibleUnreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {visibleUnreadCount > 9
              ? "9+"
              : visibleUnreadCount}
          </span>
        )}
      </button>

      

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

          

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <h2 className="font-bold text-[#0F2440]">
                Notifications
              </h2>

              <p className="text-xs text-slate-500">
                {isOwner
                  ? "Latest remittance activity"
                  : "Latest driver activity"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          

          <div className="max-h-[420px] overflow-y-auto">

            {items.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No notifications yet.
              </div>
            ) : (
              items.slice(0, 5).map((item) => {
                const unread = isNotificationUnread(item);

                

                if (isOwner) {
                  if (item.type === "shortfall") {
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-3 border-b border-slate-100 px-4 py-4 ${
                          unread ? "bg-amber-50/60" : "bg-white"
                        }`}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <Wallet size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-[#0F2440]">
                              {item.title || "Remittance shortfall"}
                            </p>

                            {unread && (
                              <span
                                className="mt-1 size-2 shrink-0 rounded-full bg-amber-500"
                                aria-label="Unread"
                              />
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.driver_name || "Driver"}
                          </p>

                          {item.message && (
                            <p className="mt-1 text-xs text-slate-400">
                              {item.message}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                              Short {currency(item.amount)}
                            </span>

                            {item.vehicle_registration && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                {item.vehicle_registration}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-[11px] text-slate-400">
                            {item.time || formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`flex gap-3 border-b border-slate-100 px-4 py-4 ${
                        unread
                          ? "bg-emerald-50/50"
                          : "bg-white"
                      }`}
                    >
                      

                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#16A34A]">
                        <CheckCircle2 size={18} />
                      </div>

                      

                      <div className="min-w-0 flex-1">

                        

                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-[#0F2440]">
                            {item.title ||
                              "Daily remittance received"}
                          </p>

                          {unread && (
                            <span
                              className="mt-1 size-2 shrink-0 rounded-full bg-[#16A34A]"
                              aria-label="Unread"
                            />
                          )}
                        </div>

                        

                        <p className="mt-1 text-sm text-slate-500">
                          {item.driver_name ||
                            item.driverName ||
                            "Driver"}
                        </p>

                        

                        {item.message && (
                          <p className="mt-1 text-xs text-slate-400">
                            {item.message}
                          </p>
                        )}

                        

                        <div className="mt-2 flex flex-wrap gap-2">

                          

                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                            {currency(item.amount)}
                          </span>

                         

                          {(item.vehicle_registration ||
                            item.vehicle) && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                              {item.vehicle_registration ||
                                item.vehicle}
                            </span>
                          )}

                          

                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Received
                          </span>
                        </div>

                        

                        <p className="mt-2 text-[11px] text-slate-400">
                          {item.time ||
                            formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                }

                

                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 border-b border-slate-100 px-4 py-4 ${
                      unread
                        ? "bg-emerald-50/50"
                        : "bg-white"
                    }`}
                  >

                    

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#1E3A5F]">
                      {getDriverIcon(item.type)}
                    </div>

                    

                    <div className="min-w-0 flex-1">

                     

                      <div className="flex items-start justify-between gap-2">

                        <p className="text-sm font-bold text-[#0F2440]">
                          {item.title ||
                            getDefaultDriverTitle(
                              item.type
                            )}
                        </p>

                        {unread && (
                          <span
                            className="mt-1 size-2 shrink-0 rounded-full bg-[#16A34A]"
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      

                      <p className="mt-1 text-sm text-slate-500">
                        {item.message ||
                          getDefaultDriverMessage(
                            item.type,
                            item
                          )}
                      </p>

                      

                      {(item.type ===
                        "customer_payment_received" ||
                        item.type ===
                          "customer_payment") && (
                        <div className="mt-2 flex flex-wrap gap-2">

                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                            {currency(item.amount)}
                          </span>

                          {item.customer_phone && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              {item.customer_phone}
                            </span>
                          )}

                          {item.vehicle_registration && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                              {item.vehicle_registration}
                            </span>
                          )}

                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Paid
                          </span>
                        </div>
                      )}

                      

                      {item.type ===
                        "vehicle_assigned" && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">

                          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-[#1E3A5F]">

                            <Car size={14} />

                            {item.vehicle_registration ||
                              item.vehicle ||
                              "Vehicle assigned"}
                          </span>

                          {item.vehicle_model && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              {item.vehicle_model}
                            </span>
                          )}

                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            Assigned
                          </span>
                        </div>
                      )}

                      

                      {(item.type ===
                        "daily_remittance_sent" ||
                        item.type ===
                          "remittance_sent") && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">

                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">

                            <CheckCircle2 size={14} />

                            {currency(item.amount)}
                          </span>

                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Sent to owner
                          </span>
                        </div>
                      )}

                     

                      <p className="mt-2 text-[11px] text-slate-400">
                        {formatDate(item.created_at)}
                      </p>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          

          <div className="border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full rounded-xl bg-[#0F2440] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E3A5F]"
            >
              {isOwner
                ? "View all remittances"
                : "View all notifications"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}