import { Check, CircleAlert, Loader2, X } from "lucide-react";
import { useState } from "react";
import Pagination from "../../components/shared/Pagination.jsx";
import { createFarePayment } from "../../lib/api.js";

const quickAmounts = [50, 100, 150, 200, 300];

const initialPrompts = [
  {
    id: 1,
    time: "10:42 AM",
    amount: 150,
    phone: "+254 712  ••  84",
    status: "Paid",
  },
  {
    id: 2,
    time: "9:18 AM",
    amount: 100,
    phone: "+254 701  ••  26",
    status: "Pending",
  },
];

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-KE");
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "");

  if (digits.length < 7) {
    return value;
  }

  return "+254 " + digits.slice(-9, -6) + "  ••  " + digits.slice(-2);
}

export default function FarePaymentModal({
  vehicleId,
  onClose,
}) {
  const [amount, setAmount] = useState("100");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [prompts, setPrompts] = useState(initialPrompts);
  const [promptPage, setPromptPage] = useState(1);

  const promptPageSize = 5;

  const promptPageCount = Math.max(
    1,
    Math.ceil(prompts.length / promptPageSize),
  );

  const visiblePrompts = prompts.slice(
    (promptPage - 1) * promptPageSize,
    promptPage * promptPageSize,
  );

  const cleanPhone = phone.replace(/\D/g, "");

  const isValid =
    Boolean(vehicleId) &&
    Number(amount) > 0 &&
    /^07\d{8}$/.test(cleanPhone);

  async function handleSendPrompt() {
    if (!isValid || status === "loading") {
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await createFarePayment({
        vehicle_id: vehicleId,
        customer_phone: cleanPhone,
        amount: Number(amount),
      });

      const farePayment =
        response?.fare_payment || response?.payment || {};

      const paymentId =
        farePayment.id || Date.now();

      const paymentStatus =
        farePayment.payment_status || "pending";

      const newPrompt = {
        id: paymentId,
        time: new Intl.DateTimeFormat("en-KE", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
        amount: Number(amount),
        phone: maskPhone(cleanPhone),
        status:
          paymentStatus === "confirmed"
            ? "Paid"
            : paymentStatus === "failed"
              ? "Failed"
              : "Pending",
      };

      setPrompts((current) => [
        newPrompt,
        ...current,
      ]);

      setPromptPage(1);
      setStatus("success");
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "We couldn't send the payment prompt. Please try again.",
      );
      setStatus("failed");
    }
  }

  function handleRetry() {
    setStatus("idle");
    setErrorMessage("");
  }

  function handleSendAnother() {
    setStatus("idle");
    setErrorMessage("");
    setPhone("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F2440]/55 p-0 sm:items-center sm:p-5"
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fare-payment-title"
      >
        <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-5 sm:px-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              M-Pesa collection
            </p>

            <h2
              id="fare-payment-title"
              className="text-xl font-bold text-[#0F2440]"
            >
              Request Fare Payment
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={status === "loading"}
            className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#0F2440] disabled:opacity-50"
            aria-label="Close fare payment prompt"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">

          {status === "success" ? (
            <div
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"
              role="status"
            >
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#16A34A] text-white">
                <Check
                  size={26}
                  strokeWidth={2.5}
                />
              </div>

              <p className="mt-3 text-sm font-semibold text-emerald-800">
                Payment prompt sent — KES{" "}
                {formatAmount(amount)} is awaiting customer payment.
              </p>

              <p className="mt-2 text-xs text-emerald-700">
                The customer should check their phone and complete the M-Pesa prompt.
              </p>

              <button
                type="button"
                onClick={handleSendAnother}
                className="mt-4 text-sm font-bold text-[#1E3A5F] underline underline-offset-2"
              >
                Send another prompt
              </button>
            </div>
          ) : status === "failed" ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-5"
              role="alert"
            >
              <div className="flex items-start gap-3 text-red-700">
                <CircleAlert
                  className="mt-0.5 shrink-0"
                  size={20}
                />

                <div>
                  <p className="font-semibold">
                    Payment prompt failed
                  </p>

                  <p className="mt-1 text-sm">
                    {errorMessage ||
                      "We couldn't send the payment prompt. Please try again."}
                  </p>

                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-3 text-sm font-bold underline underline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="fare-amount"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Fare amount
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-[#1E3A5F]">
                  <span className="font-semibold text-slate-400">
                    KES
                  </span>

                  <input
                    id="fare-amount"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    className="w-full border-0 px-3 py-3 font-mono text-lg font-bold text-[#0F2440] outline-none focus:ring-0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Customer phone
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-[#1E3A5F]">
                  <input
                    id="customer-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    className="w-full border-0 px-3 py-3 font-mono text-base text-[#0F2440] outline-none focus:ring-0"
                    placeholder="0712345678"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Quick amount
                </p>

                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(String(quickAmount))}
                      className={
                        Number(amount) === quickAmount
                          ? "rounded-xl border border-[#16A34A] bg-[#16A34A] px-4 py-2 font-mono text-sm font-bold text-white transition"
                          : "rounded-xl border border-slate-200 bg-white px-4 py-2 font-mono text-sm font-bold text-slate-600 transition hover:border-[#16A34A] hover:text-[#16A34A]"
                      }
                      aria-pressed={Number(amount) === quickAmount}
                    >
                      KES {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSendPrompt}
                  disabled={
                    !isValid ||
                    status === "loading"
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A5F] px-4 py-3.5 font-semibold text-white transition hover:bg-[#0F2440] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "loading" && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {status === "loading"
                    ? "Sending…"
                    : "Send M-Pesa Prompt"}
                </button>

                <p className="mt-2 text-center text-xs text-slate-500">
                  Customer will receive an STK push on their phone
                </p>

                {!vehicleId && (
                  <p className="mt-2 text-center text-xs font-medium text-red-600">
                    No active vehicle is assigned to this driver.
                  </p>
                )}
              </div>
            </>
          )}

          <section
            className="border-t border-black/[0.06] pt-5"
            aria-labelledby="recent-fare-prompts-title"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3
                id="recent-fare-prompts-title"
                className="text-sm font-bold text-[#0F2440]"
              >
                Recent Fare Prompts
              </h3>

              <span className="text-xs text-slate-400">
                Today
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {visiblePrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-[#0F2440]">
                      KES {formatAmount(prompt.amount)}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {prompt.time} · {prompt.phone}
                    </p>
                  </div>

                  <span
                    className={
                      prompt.status === "Paid"
                        ? "shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700"
                        : prompt.status === "Pending"
                          ? "shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700"
                          : "shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase text-red-700"
                    }
                  >
                    {prompt.status}
                  </span>
                </div>
              ))}
            </div>

            <Pagination
              page={promptPage}
              pageCount={promptPageCount}
              onPageChange={setPromptPage}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
