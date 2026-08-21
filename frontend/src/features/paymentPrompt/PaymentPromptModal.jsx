import { useState } from "react";

export default function PaymentPromptModal({
  driver,
  onClose,
  onSuccess,
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!driver) return null;

  const outstanding = driver.expected - driver.collected;

  const handleSendPrompt = async () => {
    setSending(true);
    setError("");

    try {
      
      await new Promise((resolve) => setTimeout(resolve, 800));

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to send payment prompt.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="payment-prompt-overlay">
      <div
        className="payment-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-prompt-title"
      >
        <div className="payment-prompt-header">
          <h2 id="payment-prompt-title">Prompt for Payment</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="payment-prompt-body">
          <p>
            Send a payment reminder to <strong>{driver.name}</strong>?
          </p>

          <div className="payment-prompt-details">
            <div>
              <span>Vehicle</span>
              <strong>{driver.vehicle}</strong>
            </div>

            <div>
              <span>Outstanding</span>
              <strong>
                KES {outstanding.toLocaleString("en-KE")}
              </strong>
            </div>
          </div>

          {error && (
            <p className="payment-prompt-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="payment-prompt-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSendPrompt}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Prompt"}
          </button>
        </div>
      </div>
    </div>
  );
}
