/* ------------------------------------------------------------------
   components/create-order/SelectPaymentMethod.tsx
------------------------------------------------------------------ */
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";

/* ---------- types ---------- */
export interface PaymentMethod {
  name: string;
  label: string;
  help?: string;
}

interface SelectPaymentMethodProps {
  value: string | null;
  methods: PaymentMethod[];
  loading: boolean;
  onChange(methodKey: string | null, method: PaymentMethod | null): void;
}

/* ---------- helpers ---------- */
const fmt = (m: PaymentMethod) =>
  m.label || m.name.charAt(0).toUpperCase() + m.name.slice(1);

/* ---------- component ---------- */
export default function SelectPaymentMethod({
  value,
  methods,
  loading,
  onChange,
}: SelectPaymentMethodProps) {
  const [open, setOpen]       = useState(false);
  const dropdownRef           = useRef<HTMLDivElement>(null);

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

  return (
    <div className="py-4 bg-white space-y-4 mt-6">
      <h2 className="font-bold">Méthode de paiement</h2>

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
