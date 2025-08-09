/* ------------------------------------------------------------------
   components/create-order/SelectAddress.tsx
   Sélection d’une adresse de livraison
------------------------------------------------------------------ */
"use client";

import React, {
  useRef,
  useState,
  useEffect,
  MouseEvent as ReactMouseEvent,
} from "react";
import {
  AiOutlineDown,
  AiOutlineUp,
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineSetting,
} from "react-icons/ai";
import AddAddress from "@/components/create-order/AddAddress";
import ManageAddresses from "@/components/create-order/ManageAddresses";
import type { Client } from "@/components/create-order/selectClient";

/* ---------- types ---------- */
export interface Address {
  _id: string;
  Name: string;
  StreetAddress: string;
  Country: string;
  Province?: string;
  City: string;
  PostalCode: string;
  Phone: string;
}

interface SelectAddressProps {
  client:    Client | null;
  addresses: Address[];
  value:     string | null;
  onChange(id: string | null, label: string | null): void;
  loading?:  boolean;
  refreshAddresses?: () => void | Promise<void>; // 👈 NEW
}


/* ---------- helpers ---------- */
const fmt = (a: Address) =>
  [a.Name, a.StreetAddress, `${a.City} ${a.PostalCode}`.trim(), a.Country]
    .filter(Boolean)
    .join(", ");

/* ---------- component ---------- */
export default function SelectAddress({
  client,
  addresses,
  value,
  onChange,
  loading = false,
   refreshAddresses, 
}: SelectAddressProps) {
  /* ---------- state local ---------- */
  const [open,          setOpen]         = useState(false);
  const [showForm,      setShowForm]     = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [showManage,    setShowManage]   = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* fermer dropdown sur clic extérieur */
  useEffect(() => {
    const close = (e: MouseEvent | ReactMouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ---------- early return ---------- */
  if (!client) return null;

  /* ---------- selected address ---------- */
  const selected =
    value ? addresses.find((a) => a._id === value) || null : null;

  /* ---------- modal helpers ---------- */
  const openAddForm  = () => { setAddressToEdit(null); setShowForm(true); };
  const openEditForm = () => { if (selected) { setAddressToEdit(selected); setShowForm(true); } };
  const closeForm    = () => setShowForm(false);

  const openManage   = () => setShowManage(true);
  const closeManage  = () => setShowManage(false);

  /* ---------- UI ---------- */
  return (
    <>
      {/* Dropdown select */}
      <div className="relative w-full py-4 bg-white space-y-4 mt-6">
        <h2 className="font-bold">Adresse de livraison</h2>
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
                ? "Chargement des adresses…"
                : addresses.length === 0
                ? "Aucune adresse enregistrée pour ce client."
                : "-- Choisir une adresse --"}
            </span>
            {open ? (
              <AiOutlineUp className="h-4 w-4 text-gray-500 shrink-0" />
            ) : (
              <AiOutlineDown className="h-4 w-4 text-gray-500 shrink-0" />
            )}
          </button>

          {open && (
            <ul
              className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md
                         bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
            >
              {!loading &&
                addresses.map((a) => (
                  <li
                    key={a._id}
                    onClick={() => {
                      onChange(a._id, fmt(a));
                      setOpen(false);
                    }}
                    className={`cursor-pointer select-none px-4 py-2 hover:bg-primary hover:text-white ${
                      a._id === value ? "bg-primary/5 font-medium" : ""
                    }`}
                  >
                    {fmt(a)}
                    {(a.StreetAddress || a.Phone) && (
                      <p className="text-xs text-gray-500">
                        {a.StreetAddress ?? ""}{" "}
                        {a.Phone ? "• " + a.Phone : ""}
                      </p>
                    )}
                  </li>
                ))}

              {/* Message quand aucune adresse n’est disponible */}
              {!loading && addresses.length === 0 && (
                <li className="px-4 py-2 text-gray-500 italic select-none cursor-default">
                  Aucune adresse enregistrée pour ce client.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        {/* Add */}
        <button
          type="button"
          onClick={openAddForm}
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm
                     flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          <AiOutlinePlus className="h-4 w-4" />
          Ajouter une nouvelle adresse
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={openEditForm}
          disabled={!selected}
          className={`w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm
                      flex items-center gap-4 cursor-pointer ${
                        selected
                          ? "hover:bg-primary hover:text-white"
                          : "opacity-50 cursor-not-allowed"
                      }`}
        >
          <AiOutlineEdit className="h-4 w-4" />
          Modifier l’adresse sélectionnée
        </button>

        {/* Manage / delete */}
        <button
          type="button"
          onClick={openManage}
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm
                     flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          <AiOutlineSetting className="h-4 w-4" />
          Gérer / supprimer
        </button>
      </div>

      {/* Modal Add / Edit */}
      <AddAddress
    isFormVisible={showForm}
    getAddress={async () => {     
      await refreshAddresses?.();
    }}
    toggleForminVisibility={closeForm}
    clientId={client._id}
    editAddress={addressToEdit || undefined}
  />

      {/* Modal Manage / Delete */}
      <ManageAddresses
    isVisible={showManage}
    addresses={addresses}
    fetched={true}
    onClose={closeManage}
    refresh={async () => {         
      await refreshAddresses?.();
    }}
  />
    </>
  );
}
