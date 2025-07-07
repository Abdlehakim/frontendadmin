// ───────────────────────────────────────────────────────────────
// app/payment-options/payment-methodes/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useState } from "react";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSpinner } from "react-icons/fa6";

/* ───────── constants ───────── */
const METHOD_ORDER = [
  "Payment on Delivery",
  "PayPal",
  "Stripe",
] as const;
type MethodName = (typeof METHOD_ORDER)[number];

/* ───────── types ───────── */
interface PaymentMethod {
  _id: string;
  name: MethodName;     // will always be one of METHOD_ORDER
  enabled: boolean;
}

/* Fallback in case the DB is empty on first visit */
const blankMethods: PaymentMethod[] = METHOD_ORDER.map((name) => ({
  _id: name,          // temporary id
  name,
  enabled: false,
}));

export default function PaymentMethodesPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>(blankMethods);
  const [loading, setLoading] = useState(true);

  /* ───────── fetch existing settings ───────── */
  useEffect(() => {
    async function loadData() {
      try {
        /* GET  /payment-options/payment-methodes
           expected { methods: PaymentMethod[] } */
        const res = await fetchFromAPI<{ methods: PaymentMethod[] }>(
          "/payment-options/payment-methodes",
        );

        /* Ensure all 3 methods are present & in order */
        const merged = METHOD_ORDER.map<PaymentMethod>((name) => {
          const found = res.methods.find((m) => m.name === name);
          return (
            found ?? {
              _id: name,   // placeholder id, won’t matter until saved
              name,
              enabled: false,
            }
          );
        });
        setMethods(merged);
      } catch (err) {
        console.error("Error loading payment methods:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /* ───────── toggle helper ───────── */
  const handleToggle = async (method: PaymentMethod) => {
    const newEnabled = !method.enabled;

    // optimistic UI
    setMethods((prev) =>
      prev.map((m) =>
        m.name === method.name ? { ...m, enabled: newEnabled } : m,
      ),
    );

    try {
      /* PUT  /payment-options/payment-methodes/update/<id>
         body { enabled: boolean } */
      await fetchFromAPI(
        `/payment-options/payment-methodes/update/${method._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: newEnabled }),
        },
      );
    } catch (err) {
      console.error("Failed to update payment method:", err);
      alert("Failed to save changes. Reverting.");
      // revert on failure
      setMethods((prev) =>
        prev.map((m) =>
          m.name === method.name ? { ...m, enabled: !newEnabled } : m,
        ),
      );
    }
  };

  /* ───────── helpers ───────── */
  const renderCheckbox = (method: PaymentMethod) => (
    <td key={method.name} className="px-4 py-2 text-center">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={method.enabled}
        onChange={() => handleToggle(method)}
      />
    </td>
  );

  /* ───────── render ───────── */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      <h1 className="text-3xl font-bold uppercase">Payment Methods</h1>

      <div className="flex-1 flex flex-col overflow-hidden border rounded">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white">
            <tr>
              {METHOD_ORDER.map((m) => (
                <th
                  key={m}
                  className="px-4 py-2 text-sm font-medium text-center"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
            {loading ? (
              <tr>
                <td colSpan={METHOD_ORDER.length} className="py-6 text-center">
                  <FaSpinner className="animate-spin text-3xl inline-block" />
                </td>
              </tr>
            ) : (
              <tr className="even:bg-gray-100 odd:bg-white">
                {methods.map(renderCheckbox)}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
