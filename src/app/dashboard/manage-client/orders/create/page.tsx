/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/create/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";

import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectAddress, { Address } from "@/components/create-order/selectAddress";
import SelectDeliveryOption, {
  DeliveryOption,
} from "@/components/create-order/selectDeliveryOption";
import SelectBoutiques, {
  Boutique,
} from "@/components/create-order/SelectBoutiques";
import SelectProducts, {
  BasketItem,
} from "@/components/create-order/selectProducts";
import OrderPreview from "@/components/create-order/OrderPreview"; // ⇦ NEW

/* ---------- helpers ---------- */
const fmtAddress = (a: Address | null) =>
  a ? `${a.Name},${a.StreetAddress}, ${a.City} ${a.PostalCode}, ${a.Country}` : null;

export default function CreateOrderPage() {
  /* ---------- state ---------- */
  const [client, setClient] = useState<Client | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [selectedAddressLbl, setSelectedAddressLbl] = useState<string | null>(
    null
  );

  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string | null>(
    null
  );
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(
    null
  );

  const [deliveryOpt, setDeliveryOpt] = useState<DeliveryOption | null>(null);

  const [basket, setBasket] = useState<BasketItem[]>([]);

  const [showPreview, setShowPreview] = useState(false); // ⇦ NEW

  /* ---------- helpers ---------- */
  const resetAll = () => {
    setClient(null);
    setSelectedAddressId(null);
    setSelectedAddressLbl(null);
    setSelectedBoutiqueId(null);
    setSelectedBoutique(null);
    setDeliveryOpt(null);
    setBasket([]);
  };

  // mémoïse la fonction pour que son identité reste stable
  const handleAddressChange = useCallback(
    (id: string | null, addr: Address | null) => {
      setSelectedAddressId(id);
      setSelectedAddressLbl(fmtAddress(addr));
    },
    []
  );

  /* ---------- render ---------- */
  return (
    <div className="w-[95%] mx-auto py-4 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase">Créer une commande</h1>
        <Link href="/dashboard/manage-client/orders">
          <button className="h-10 px-4 rounded border border-gray-300 hover:bg-primary hover:text-white">
            Retour
          </button>
        </Link>
      </div>

      {/* 1. Sélection du client */}
      <SelectClient client={client} onSelect={setClient} onClear={resetAll} />

      {/* 2. Produits */}
      <SelectProducts client={client} basket={basket} setBasket={setBasket} />

      {client && (
        <>
          {/* 3. Mode de livraison */}
          <SelectDeliveryOption
            value={deliveryOpt?._id ?? null}
            onChange={(_id, opt) => {
              setDeliveryOpt(opt);
              if (!opt || opt.isPickup) {
                setSelectedAddressId(null);
                setSelectedAddressLbl(null);
              } else {
                setSelectedBoutiqueId(null);
                setSelectedBoutique(null);
              }
            }}
          />

          {/* 4A. Adresse (livraison) */}
          {deliveryOpt && !deliveryOpt.isPickup && (
            <SelectAddress
              client={client}
              value={selectedAddressId}
              onChange={handleAddressChange}
            />
          )}

          {/* 4B. Boutique (pickup) */}
          {deliveryOpt && deliveryOpt.isPickup && (
            <SelectBoutiques
              value={selectedBoutiqueId}
              onChange={(id, b) => {
                setSelectedBoutiqueId(id);
                setSelectedBoutique(b);
              }}
            />
          )}
        </>
      )}

      {/* bouton Prévisualiser */}
      {client && (
        <div className="flex justify-end pt-4">
          <button
            onClick={() => setShowPreview(true)}
            className="h-10 px-6 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
            disabled={basket.length === 0 || !deliveryOpt}
          >
            Prévisualiser
          </button>
        </div>
      )}

      {/* modal de prévisualisation */}
      {showPreview && (
        <OrderPreview
          onClose={() => setShowPreview(false)}
          client={client}
          addressLabel={selectedAddressLbl}
          boutique={selectedBoutique}
          delivery={deliveryOpt}
          basket={basket}
        />
      )}
    </div>
  );
}
