/* ------------------------------------------------------------------
   components/create-order/SelectPaymentMethod.tsx
   Sélection d’une méthode de paiement active
------------------------------------------------------------------ */
"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- redux ---------- */
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectOrderCreation,
  cachePaymentMethods,          // ⇦ action ajoutée dans le slice
} from "@/features/orderCreation/orderCreationSlice";

/* ---------- types ---------- */
export interface PaymentMethod {
  name: string;
  label: string;
  help?: string;
}

interface SelectPaymentMethodProps {
  value: string | null;
  onChange(methodKey: string | null, method: PaymentMethod | null): void;
}

/* ---------- helpers ---------- */
const fmt = (m: PaymentMethod) =>
  m.label || m.name.charAt(0).toUpperCase() + m.name.slice(1);

/* ---------- component ---------- */
export default function SelectPaymentMethod({
  value,
  onChange,
}: SelectPaymentMethodProps) {
  const dispatch          = useAppDispatch();
  const paymentCache      = useAppSelector(
    (s) => selectOrderCreation(s).paymentMethods  // champ ajouté au slice
  );

  const [methods, setMethods] = useState<PaymentMethod[]>(paymentCache);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const dropdownRef           = useRef<HTMLDivElement>(null);

  /* ---------- fetch active payment methods ---------- */
  const fetchMethods = useCallback(async () => {
    if (paymentCache.length) return;            // déjà en cache

    setLoading(true);
    try {
      const { activePaymentMethods } = await fetchFromAPI<{
        activePaymentMethods: PaymentMethod[];
      }>("/dashboardadmin/payment/payment-settings/active");

      setMethods(activePaymentMethods);
      dispatch(cachePaymentMethods(activePaymentMethods)); // ⇦ cache global

      if (!activePaymentMethods.find((m) => m.name === value)) {
        onChange(null, null);
      }
    } catch (err) {
      console.error("Load payment methods error:", err);
    } finally {
      setLoading(false);
    }
  }, [paymentCache.length, value, onChange, dispatch]);

  /* appel au montage */
  useEffect(() => {
    fetchMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent | ReactMouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected =
    value ? methods.find((m) => m.name === value) ?? null : null;

  /* ---------- UI ---------- */
  return (
    <div className="py-4 bg-white space-y-4 mt-6">
      <h2 className="font-bold">Méthode de paiement</h2>

      {/* select */}
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex h-12 w-full items-center justify-between rounded-md border
                     border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none
                     focus:ring-2 focus:ring-primary/50 max-lg:text-xs disabled:opacity-50"
          disabled={loading}
        >
          <span
            className={
              selected
                ? "block w-full truncate"
                : "text-gray-400 block w-full truncate"
            }
          >
            {selected
              ? fmt(selected)
              : loading
              ? "Chargement des méthodes de paiement…"
              : "-- Choisir une méthode --"}
          </span>
          {open ? (
            <AiOutlineUp className="h-4 w-4 shrink-0 text-gray-500" />
          ) : (
            <AiOutlineDown className="h-4 w-4 shrink-0 text-gray-500" />
          )}
        </button>

        {open && (
          <ul
            className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md
                       bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
          >
            {!loading &&
              methods.map((m) => (
                <li
                  key={m.name}
                  onClick={() => {
                    onChange(m.name, m);
                    setOpen(false);
                  }}
                  className={`cursor-pointer select-none px-4 py-2 hover:bg-primary hover:text-white ${
                    m.name === value ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  <p>{fmt(m)}</p>
                  {m.help && (
                    <p className="text-xs text-gray-500 mt-1">{m.help}</p>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
