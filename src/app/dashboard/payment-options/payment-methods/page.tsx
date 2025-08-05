"use client";

import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types ---------- */
interface MethodCfg {
  _id: string;
  name: string;
  enabled: boolean;
  label: string;
  help: string;
}

interface PaymentMethodsResponse {
  paymentMethods: MethodCfg[]; // ✅ Matches updated backend key
}

export default function PaymentSettingsPage() {
  const [methods, setMethods] = useState<Record<string, MethodCfg> | null>(null);
  const [methodIds, setMethodIds] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ label: string; help: string }>({
    label: "",
    help: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchFromAPI<PaymentMethodsResponse>(
          "/dashboardadmin/payment/payment-settings"
        );

        if (!res || !Array.isArray(res.paymentMethods)) {
          throw new Error("Invalid response format");
        }

        const mapped = Object.fromEntries(res.paymentMethods.map((m) => [m._id, m]));
        const ids = res.paymentMethods.map((m) => m._id);

        setMethods(mapped);
        setMethodIds(ids);
        setUpdatedAt(new Date().toISOString());
      } catch (err) {
        console.error("Fetch payment methods failed:", err);
        setMethods(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const patchMethod = async (id: string, patch: Partial<MethodCfg>) => {
    if (!methods) return;
    const prevMethods = methods;
    const prevUpdatedAt = updatedAt;

    const next = { ...methods, [id]: { ...methods[id], ...patch } };
    setMethods(next);

    try {
      await fetchFromAPI(`/dashboardadmin/payment/payment-settings/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [methods[id].name]: patch }),
      });
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error(err);
      setMethods(prevMethods);
      setUpdatedAt(prevUpdatedAt);
      alert("Failed to update payment settings.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (!methods) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Unable to load payment methods.
      </div>
    );
  }

  const getMethodName = (key: string) => {
    const name = methods[key].name;
    if (name === "cashOnDelivery") return "Cash on Delivery";
    if (name === "payInMagasin") return "Pay in Magasin";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6 h-full">
      <h1 className="text-3xl font-bold uppercase">Payment Methods</h1>

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white">
            <tr>
              <th className="w-[20%] py-2 pl-4 text-left text-sm font-medium">Method</th>
              <th className="w-[10%] py-2 text-sm font-medium text-center">Active</th>
              <th className="w-[22%] py-2 text-sm font-medium text-center">Label</th>
              <th className="w-[22%] py-2 text-sm font-medium text-center">Help</th>
              <th className="w-[16%] py-2 text-sm font-medium text-center">Edit</th>
              <th className="w-[10%] py-2 text-sm font-medium text-center">Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {methodIds.map((id) => {
              const cfg = methods[id];
              const isEditing = editId === id;

              return (
                <tr key={id}>
                  <td className="py-3 pl-4 font-medium">{getMethodName(id)}</td>
                  <td className="py-3 text-center">{cfg.enabled ? "✅" : "❌"}</td>
                  <td className="py-2 text-center">
                    {isEditing ? (
                      <input
                        className="w-11/12 border rounded px-2 py-1 text-sm text-center"
                        value={draft.label}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, label: e.target.value }))
                        }
                      />
                    ) : (
                      <span>
                        {cfg.label || <em className="text-gray-400">(blank)</em>}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {isEditing ? (
                      <input
                        className="w-11/12 border rounded px-2 py-1 text-sm text-center"
                        value={draft.help}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, help: e.target.value }))
                        }
                      />
                    ) : (
                      <span>
                        {cfg.help || <em className="text-gray-400">(blank)</em>}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center space-x-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            patchMethod(id, draft);
                            setEditId(null);
                          }}
                          className="border rounded px-3 py-1 bg-tertiary text-white hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="border rounded px-3 py-1 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditId(id);
                          setDraft({ label: cfg.label, help: cfg.help });
                        }}
                        className="border rounded px-3 py-1 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => patchMethod(id, { enabled: !cfg.enabled })}
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
          Last updated: {new Date(updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
