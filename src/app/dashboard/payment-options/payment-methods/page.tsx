/* ------------------------------------------------------------------
   src/app/dashboard/payment-options/payment-methods/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- api payload ---------- */
interface PaymentSettings {
  paypal: boolean;
  stripe: boolean;
  cashOnDelivery: boolean;
  updatedAt: string;
}

const methodKeys = [
  { key: "paypal",          label: "PayPal"           },
  { key: "stripe",          label: "Stripe"           },
  { key: "cashOnDelivery",  label: "Cash on Delivery" },
] as const;

export default function PaymentMethodsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading]   = useState(true);

  /* ---------- initial fetch ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { paymentSettings } =
          await fetchFromAPI<{ paymentSettings: PaymentSettings }>(
            "/dashboardadmin/checkout/payment-settings"
          );
        setSettings(paymentSettings);
      } catch (err) {
        console.error("Fetch payment settings failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- toggle helper ---------- */
  const toggle = async (key: keyof PaymentSettings) => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next); // optimistic

    try {
      await fetchFromAPI("/dashboardadmin/checkout/payment-settings/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
    } catch {
      // revert on failure
      setSettings(settings);
      alert("Failed to update payment method status.");
    }
  };

  /* ---------- ui ---------- */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Unable to load payment settings.
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6 h-full">
      {/* header */}
      <h1 className="text-3xl font-bold uppercase">Payment Methods</h1>

      {/* table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white">
            <tr>
              <th className="w-1/3 py-2 text-sm font-medium text-left pl-4">
                Method
              </th>
              <th className="w-1/3 py-2 text-sm font-medium text-center">
                Active
              </th>
              <th className="w-1/3 py-2 text-sm font-medium text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {methodKeys.map(({ key, label }) => (
              <tr key={key}>
                <td className="py-3 pl-4">{label}</td>
                <td className="py-3 text-center">
                  {settings[key] ? "✅" : "❌"}
                </td>
                <td className="py-3 text-center">
                  <button
                    onClick={() => toggle(key)}
                    className="border rounded px-3 py-1 hover:bg-gray-100"
                  >
                    {settings[key] ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* last-updated footer */}
        <p className="mt-4 text-sm text-gray-500">
          Last updated: {new Date(settings.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
