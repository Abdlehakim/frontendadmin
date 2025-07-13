/* ------------------------------------------------------------------
   src/app/dashboard/payment-options/currency/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface CurrencySettings {
  primary: string;
  secondaries: string[];
  updatedAt: string;
}

const CURRENCIES = ["TND", "EUR", "USD", "GBP", "CAD"] as const;

export default function CurrencySettingsPage() {
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  /* ---------- initial fetch ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { currencySettings } = await fetchFromAPI<{
          currencySettings: CurrencySettings;
        }>("/dashboardadmin/checkout/payment-currency");
        setSettings(currencySettings);
      } catch (err) {
        console.error("Fetch currency settings failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- helpers ---------- */
  const toggleSecondary = (code: string) => {
    if (!settings) return;
    const next = settings.secondaries.includes(code)
      ? settings.secondaries.filter((c) => c !== code)
      : [...settings.secondaries, code];
    setSettings({ ...settings, secondaries: next });
  };

  const saveChanges = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await fetchFromAPI("/dashboardadmin/checkout/payment-currency/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary: settings.primary,
          secondaries: settings.secondaries,
        }),
      });
    } catch {
      alert("Failed to save currency settings.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */
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
        Unable to load currency settings.
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6 h-full">
      {/* header */}
      <h1 className="text-3xl font-bold uppercase">Currency Settings</h1>

      {/* primary select */}
      <div className="flex flex-col gap-2 w-72">
        <label className="font-medium">Primary Currency*</label>
        <select
          value={settings.primary}
          onChange={(e) =>
            setSettings({ ...settings, primary: e.target.value })
          }
          className="border rounded px-3 py-2"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* secondaries list */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">Optional Currencies</label>
        <div className="flex flex-wrap gap-4">
          {CURRENCIES.filter((c) => c !== settings.primary).map((c) => (
            <label key={c} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.secondaries.includes(c)}
                onChange={() => toggleSecondary(c)}
                className="accent-primary h-4 w-4"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Last updated:&nbsp;
        {new Date(settings.updatedAt).toLocaleString()}
      </p>

      {/* save button now<footer> */}
      <button
        onClick={saveChanges}
        disabled={saving}
        className="self-start bg-tertiary text-white px-4 py-2 rounded hover:opacity-90 flex items-center gap-2"
      >
        {saving && <FaSpinner className="animate-spin" />} update
      </button>
    </div>
  );
}
