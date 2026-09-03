import {
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext.jsx";



function currency(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

function formatTime(value) {
  if (!value) return "";

  
  if (
    typeof value === "string" &&
    !value.includes("T") &&
    !value.includes("-")
  ) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDateStamp(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}



export default function RemittanceTransactionsPage() {
  const navigate = useNavigate();

  const {
    notifications = [],
  } = useNotifications();


  const remittances = Array.isArray(notifications)
    ? notifications.filter(
        (item) =>
          item?.type === "remittance_received" ||
          item?.type === "daily_remittance_received"
      )
    : [];

 

  const sortedRemittances = [...remittances].sort(
    (a, b) => {
      const dateA = new Date(
        a?.created_at || 0
      ).getTime();

      const dateB = new Date(
        b?.created_at || 0
      ).getTime();

      return dateB - dateA;
    }
  );

  

  function handleBack() {
    navigate("/owner/dashboard");
  }

  

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

      

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#16A34A]">
            Owner
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#0F2440]">
            Remittance Received
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Daily remittances received from your drivers.
          </p>
        </div>

        

        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F2440] shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={17} />

          Back to dashboard
        </button>

      </div>

      

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {sortedRemittances.length === 0 ? (

          

          <div className="px-6 py-16 text-center">

            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-[#16A34A]">
              <CheckCircle2 size={24} />
            </div>

            <h2 className="mt-4 text-base font-bold text-[#0F2440]">
              No remittances received yet
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Driver remittances will appear here when they are received.
            </p>

          </div>

        ) : (

          

          <div className="divide-y divide-slate-100">

            {sortedRemittances.map((item) => {

              const driverName =
                item?.driver_name ||
                item?.driverName ||
                "Driver";

              const vehicle =
                item?.vehicle_registration ||
                item?.vehicle ||
                "";

              const time =
                item?.time ||
                formatTime(item?.created_at);

              const dateStamp =
                item?.date ||
                formatDateStamp(item?.created_at);

              return (
                <article
                  key={item.id}
                  className="flex gap-4 p-5 transition hover:bg-slate-50"
                >

                  

                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#16A34A]">
                    <CheckCircle2 size={20} />
                  </div>

                  

                  <div className="min-w-0 flex-1">

                    

                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">

                      <div className="min-w-0">

                        <h2 className="text-sm font-bold text-[#0F2440]">
                          Daily remittance received
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {driverName}
                        </p>

                      </div>

                      

                      <span className="shrink-0 text-right text-[11px] text-slate-400">
                        {dateStamp && (
                          <span className="block font-medium text-slate-500">
                            {dateStamp}
                          </span>
                        )}
                        {time && <span className="block">{time}</span>}
                      </span>

                    </div>

                    

                    <div className="mt-3 flex flex-wrap gap-2">

                     

                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {currency(item?.amount)}
                      </span>

                      

                      {vehicle && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {vehicle}
                        </span>
                      )}

                     

                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Received
                      </span>

                    </div>

                    

                    {item?.message && (
                      <p className="mt-2 text-xs text-slate-400">
                        {item.message}
                      </p>
                    )}

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </section>

    </main>
  );
}