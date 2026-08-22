import { useCallback, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useRemittance(expectedAmount = 0) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remittance, setRemittance] = useState(null);

  const parsedAmount = Number(amount) || 0;

  const balance = Math.max(
    expectedAmount - parsedAmount,
    0
  );

  const shortfall = Math.max(
    expectedAmount - parsedAmount,
    0
  );

  const overpayment = Math.max(
    parsedAmount - expectedAmount,
    0
  );

  const status = useMemo(() => {
    if (!amount) {
      return "pending";
    }

    if (parsedAmount === expectedAmount) {
      return "paid";
    }

    if (parsedAmount < expectedAmount) {
      return "short";
    }

    return "over";
  }, [amount, parsedAmount, expectedAmount]);

  const submitRemittance = useCallback(async () => {
    if (!parsedAmount || parsedAmount <= 0) {
      const message = "Enter a valid remittance amount";

      setError(message);

      throw new Error(message);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/remittances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parsedAmount,
            payment_method: paymentMethod,
            reference: reference.trim(),
            notes: notes.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to submit remittance");
      }

      setRemittance(data);
      setSubmitted(true);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [
    parsedAmount,
    paymentMethod,
    reference,
    notes,
  ]);

  const reset = useCallback(() => {
    setAmount("");
    setPaymentMethod("mpesa");
    setReference("");
    setNotes("");
    setSubmitted(false);
    setLoading(false);
    setError(null);
    setRemittance(null);
  }, []);

  return {
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    reference,
    setReference,
    notes,
    setNotes,
    parsedAmount,
    balance,
    shortfall,
    overpayment,
    status,
    submitted,
    loading,
    error,
    remittance,
    submitRemittance,
    reset,
  };
}