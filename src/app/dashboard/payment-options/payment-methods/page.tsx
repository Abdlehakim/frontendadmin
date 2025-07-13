/* ------------------------------------------------------------------
   src/app/dashboard/payment-options/payment-methods/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types ---------- */
interface MethodCfg {
  enabled: boolean;
  label: string;
  help: string;
}
interface PaymentSettings {
  paypal: MethodCfg;
  stripe: MethodCfg;
  cashOnDelivery: MethodCfg;
  updatedAt: string;
}

const methodKeys = ["paypal", "stripe", "cashOnDelivery"] as const;
type MethodKey = (typeof methodKeys)[number];

export default function PaymentMethodsPage() {
  /* data */
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading,  setLoading]  = useState(true);

  /* edit state */
  const [editRow, setEditRow] = useState<MethodKey | null>(null);
  const [draft,   setDraft]   = useState<{ label: string; help: string }>({
    label: "",
    help : "",
  });

  /* ───── fetch once ───── */
  useEffect(() => {
    (async () => {
      try {
        const { paymentSettings } =
          await fetchFromAPI<{ paymentSettings: PaymentSettings }>(
            "/dashboardadmin/payment/payment-settings"
          );
        setSettings(paymentSettings);
      } catch (err) {
        console.error("Fetch payment settings failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───── optimistic patch helper ───── */
  const patchMethod = async (key: MethodKey, patch: Partial<MethodCfg>) => {
    if (!settings) return;

    /* keep a copy so we can roll back on failure */
    const prev = settings;
    const next = { ...settings, [key]: { ...settings[key], ...patch } };
    setSettings(next); // optimistic UI

    try {
      await fetchFromAPI("/dashboardadmin/payment/payment-settings/update", {
        method : "PUT",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ [key]: next[key] }),
      });
    } catch (err) {
      console.error(err);
      setSettings(prev);      // revert UI
      alert("Failed to update payment settings.");
    }
  };

  /* ───── render ───── */
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
      <h1 className="text-3xl font-bold uppercase">Payment Methods</h1>

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white">
            <tr>
              <th className="w-[20%] py-2 pl-4 text-left text-sm font-medium">
                Method
              </th>
              <th className="w-[10%] py-2 text-sm font-medium text-center">
                Active
              </th>
              <th className="w-[22%] py-2 text-sm font-medium text-center">
                Label
              </th>
              <th className="w-[22%] py-2 text-sm font-medium text-center">
                Help
              </th>
              <th className="w-[16%] py-2 text-sm font-medium text-center">
                Edit
              </th>
              <th className="w-[10%] py-2 text-sm font-medium text-center">
                Toggle
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {methodKeys.map((key) => {
              const cfg       = settings[key];
              const isEditing = editRow === key;

              return (
                <tr key={key}>
                  {/* method name */}
                  <td className="py-3 pl-4 font-medium capitalize">
                    {key === "cashOnDelivery" ? "Cash on Delivery" : key}
                  </td>

                  {/* active icon */}
                  <td className="py-3 text-center">
                    {cfg.enabled ? "✅" : "❌"}
                  </td>

                  {/* label cell */}
                  <td className="py-2 text-center">
                    {isEditing ? (
                      <input
                        className="w-11/12 border rounded px-2 py-1 text-sm text-center"
                        value={draft.label ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, label: e.target.value }))
                        }
                      />
                    ) : (
                      <span>
                        {cfg.label || (
                          <em className="text-gray-400">(blank)</em>
                        )}
                      </span>
                    )}
                  </td>

                  {/* help cell */}
                  <td className="py-2 text-center">
                    {isEditing ? (
                      <input
                        className="w-11/12 border rounded px-2 py-1 text-sm text-center"
                        value={draft.help ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, help: e.target.value }))
                        }
                      />
                    ) : (
                      <span>
                        {cfg.help || (
                          <em className="text-gray-400">(blank)</em>
                        )}
                      </span>
                    )}
                  </td>

                  {/* edit / save / cancel */}
                  <td className="py-3 text-center space-x-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            patchMethod(key, draft);
                            setEditRow(null);
                          }}
                          className="border rounded px-3 py-1 bg-tertiary text-white hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditRow(null)}
                          className="border rounded px-3 py-1 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditRow(key);
                          /* fallback to "" so inputs are always controlled */
                          setDraft({
                            label: cfg.label ?? "",
                            help : cfg.help  ?? "",
                          });
                        }}
                        className="border rounded px-3 py-1 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                    )}
                  </td>

                  {/* toggle column alone */}
                  <td className="py-3 text-center">
                    <button
                      onClick={() =>
                        patchMethod(key, { enabled: !cfg.enabled })
                      }
                      className="border rounded px-3 py-1 hover:bg-gray-100"
                    >
                      {cfg.enabled ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mt-4 text-sm text-gray-500">
          Last updated:{" "}
          {new Date(settings.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
