import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Info,
  Smartphone,
  Wallet,
} from "lucide-react";
import "../../styles/driver-remittance.css";

const paymentMethods = [
  {
    id: "mpesa",
    label: "M-Pesa",
    description: "Mobile money",
    icon: Smartphone,
  },
  {
    id: "cash",
    label: "Cash",
    description: "Cash payment",
    icon: Wallet,
  },
];

export default function RemittancePage() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const expectedAmount = 3500;
  const parsedAmount = Number(amount) || 0;
  const balance = Math.max(expectedAmount - parsedAmount, 0);
  const shortfall = Math.max(expectedAmount - parsedAmount, 0);
  const overpayment = Math.max(parsedAmount - expectedAmount, 0);

  const status = useMemo(() => {
    if (!amount) return "pending";
    if (parsedAmount === expectedAmount) return "paid";
    if (parsedAmount < expectedAmount) return "short";
    return "over";
  }, [amount, parsedAmount]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!parsedAmount) return;

    console.log({
      amount: parsedAmount,
      paymentMethod,
      reference,
      notes,
      status,
    });

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="driver-remittance-page">
        <section className="remittance-success">
          <div className="success-icon">
            <CheckCircle2 size={34} />
          </div>

          <p className="eyebrow">REMITTANCE SUBMITTED</p>

          <h1>KES {parsedAmount.toLocaleString()}</h1>

          <p className="success-copy">
            Your remittance for <strong>KDG 482P</strong> has been recorded.
          </p>

          <div className="success-details">
            <div>
              <span>Vehicle</span>
              <strong>KDG 482P</strong>
            </div>

            <div>
              <span>Payment method</span>
              <strong>
                {
                  paymentMethods.find(
                    (item) => item.id === paymentMethod
                  )?.label
                }
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong className={`status-text ${status}`}>
                {status === "paid"
                  ? "Paid in full"
                  : status === "short"
                    ? "Short remittance"
                    : "Above target"}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setSubmitted(false);
              setAmount("");
              setReference("");
              setNotes("");
            }}
          >
            Enter another remittance
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="driver-remittance-page">
      <div className="mobile-header">
        <button
          type="button"
          className="back-button"
          aria-label="Go back"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <p className="eyebrow">DRIVER PORTAL</p>
          <h1>Submit remittance</h1>
        </div>

        <div className="header-spacer" />
      </div>

      <form onSubmit={handleSubmit} className="remittance-form">
        <section className="vehicle-card">
          <div className="vehicle-card-top">
            <div>
              <p className="eyebrow">ASSIGNED VEHICLE</p>
              <h2>KDG 482P</h2>
              <p>Nairobi</p>
            </div>

            <span className="vehicle-status">
              <span className="status-dot" />
              Active
            </span>
          </div>

          <div className="vehicle-divider" />

          <div className="target-row">
            <div>
              <span>Today's target</span>
              <strong>KES {expectedAmount.toLocaleString()}</strong>
            </div>

            <div className="target-meta">
              <Clock3 size={15} />
              <span>Due today</span>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">REMITTANCE</p>
              <h2>Amount received</h2>
            </div>
          </div>

          <div className={`amount-input-wrap ${status}`}>
            <span className="currency">KES</span>

            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="50"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              aria-label="Remittance amount"
            />
          </div>

          <div className="amount-helper">
            <Info size={15} />

            {!amount && (
              <span>Enter the amount you are remitting today.</span>
            )}

            {status === "paid" && (
              <span className="paid-helper">
                Full daily target reached.
              </span>
            )}

            {status === "short" && (
              <span>
                KES {shortfall.toLocaleString()} remaining to reach
                today's target.
              </span>
            )}

            {status === "over" && (
              <span>
                KES {overpayment.toLocaleString()} above today's target.
              </span>
            )}
          </div>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PAYMENT</p>
              <h2>Payment method</h2>
            </div>
          </div>

          <div className="payment-methods">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const selected = paymentMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  className={`payment-method ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <span className="payment-icon">
                    <Icon size={19} />
                  </span>

                  <span className="payment-copy">
                    <strong>{method.label}</strong>
                    <small>{method.description}</small>
                  </span>

                  <span className="radio">
                    {selected && <span />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {paymentMethod === "mpesa" && (
          <section className="form-section compact-section">
            <label htmlFor="reference">M-Pesa reference</label>

            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. SJK82KLM90"
              className="text-input"
              maxLength={32}
            />
          </section>
        )}

        <section className="form-section compact-section">
          <label htmlFor="notes">
            Note <span>(optional)</span>
          </label>

          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add a note about today's remittance..."
            className="text-input notes-input"
            rows={3}
          />
        </section>

        <section className="summary-card">
          <div>
            <span>Today's target</span>
            <strong>KES {expectedAmount.toLocaleString()}</strong>
          </div>

          <div>
            <span>You are submitting</span>
            <strong>KES {parsedAmount.toLocaleString()}</strong>
          </div>

          <div className="summary-total">
            <span>
              {status === "short"
                ? "Outstanding"
                : status === "over"
                  ? "Above target"
                  : "Balance"}
            </span>

            <strong>
              KES{" "}
              {(status === "over" ? overpayment : balance).toLocaleString()}
            </strong>
          </div>
        </section>

        <button
          type="submit"
          className="submit-button"
          disabled={!parsedAmount}
        >
          Submit remittance
          <ChevronDown className="submit-icon" size={19} />
        </button>

        <p className="form-footnote">
          Your submission will be visible to the fleet owner immediately.
        </p>
      </form>
    </main>
  );
}




