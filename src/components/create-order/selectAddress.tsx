/* ------------------------------------------------------------------
   components/create-order/SelectAddress.tsx
   Sélection d’une adresse de livraison
------------------------------------------------------------------ */
"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import {
  AiOutlineDown,
  AiOutlineUp,
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineSetting,
} from "react-icons/ai";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import AddAddress from "@/components/create-order/AddAddress";
import ManageAddresses from "@/components/create-order/ManageAddresses";
import type { Client } from "@/components/create-order/selectClient";

/* ---------- redux ---------- */
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  cacheAddresses,            // ⇦ nouvelle action (voir slice)
  selectOrderCreation,
} from "@/features/orderCreation/orderCreationSlice";

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
  client: Client | null;
  value: string | null;
  onChange(id: string | null, addr: Address | null): void;
}

/* ---------- helpers ---------- */
const fmt = (a: Address) =>
  `${a.Name}, ${a.StreetAddress}, ${a.City} ${a.PostalCode}, ${a.Country}`;

/* ---------- component ---------- */
export default function SelectAddress({
  client,
  value,
  onChange,
}: SelectAddressProps) {
  const dispatch = useAppDispatch();

  /* ---------- cache global ---------- */
  const addressesCache = useAppSelector(
    (s) => selectOrderCreation(s).addressesCache // { [clientId]: Address[] }
  );

  /* ---------- state local ---------- */
  const [addresses, setAddresses] = useState<Address[]>(
    client ? addressesCache[client._id] ?? [] : []
  );
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [showManage, setShowManage]       = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---------- fetch addresses (client-dépendant) ---------- */
  const fetchAddresses = useCallback(async () => {
    if (!client) return;

    /* si déjà en cache, éviter un nouveau fetch */
    const cached = addressesCache[client._id];
    if (cached && cached.length) {
      setAddresses(cached);
      setFetched(true);
      return;
    }

    setLoading(true);
    setFetched(false);
    try {
      const { addresses }: { addresses: Address[] } = await fetchFromAPI(
        `/dashboardadmin/clientAddress/${client._id}`
      );
      setAddresses(addresses);
      dispatch(cacheAddresses({ clientId: client._id, addresses })); // ⇦ cache
    } catch (err) {
      console.error("Load addresses error:", err);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [client, addressesCache, dispatch]);

  /* fetch on mount / client change */
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  /* close dropdown on outside click */
  useEffect(() => {
    const close = (e: MouseEvent | ReactMouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
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
            className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-lg:text-xs disabled:opacity-50"
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
                : "-- Choisir une adresse --"}
            </span>
            {open ? (
              <AiOutlineUp className="h-4 w-4 text-gray-500 shrink-0" />
            ) : (
              <AiOutlineDown className="h-4 w-4 text-gray-500 shrink-0" />
            )}
          </button>

          {open && (
            <ul className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5">
              {!loading &&
                addresses.map((addr) => (
                  <li
                    key={addr._id}
                    onClick={() => {
                      onChange(addr._id, addr);
                      setOpen(false);
                    }}
                    className={`cursor-pointer select-none px-4 py-2 hover:bg-primary hover:text-white ${
                      addr._id === value ? "bg-primary/5 font-medium" : ""
                    }`}
                  >
                    {fmt(addr)}
                  </li>
                ))}
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
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          <AiOutlinePlus className="h-4 w-4" />
          Ajouter une nouvelle adresse
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={openEditForm}
          disabled={!selected}
          className={`w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 cursor-pointer ${
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
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          <AiOutlineSetting className="h-4 w-4" />
          Gérer / supprimer
        </button>
      </div>

      {/* Modal Add / Edit */}
      <AddAddress
        isFormVisible={showForm}
        getAddress={fetchAddresses}
        toggleForminVisibility={closeForm}
        clientId={client._id}
        editAddress={addressToEdit || undefined}
      />

      {/* Modal Manage / Delete */}
      <ManageAddresses
        isVisible={showManage}
        addresses={addresses}
        fetched={fetched}
        onClose={closeManage}
        refresh={fetchAddresses}
      />
    </>
  );
}
