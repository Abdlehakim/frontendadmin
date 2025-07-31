/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/create/page.tsx
   Page de création d’une commande client
------------------------------------------------------------------ */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectAddress from "@/components/create-order/selectAddress";
import SelectProducts, {
  BasketItem,
} from "@/components/create-order/selectProducts";

export default function CreateOrderPage() {
  /* ---------- state ---------- */
  const [client, setClient] = useState<Client | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  /* ---------- render ---------- */
  return (
    <div className="w-[95%] max-w-5xl mx-auto py-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase">Créer une commande</h1>
        <Link href="/dashboard/manage-client/orders">
          <button className="h-10 px-4 rounded border border-gray-300 hover:bg-primary hover:text-white">
            Retour
          </button>
        </Link>
      </div>

      {/* Sélection du client */}
      <SelectClient
        client={client}
        onSelect={(c) => setClient(c)}
        onClear={() => {
          setClient(null);
          setBasket([]);
          setSelectedAddressId(null);
        }}
      />

      {/* Sélection de l’adresse (si client “account”) */}
      <SelectAddress
        client={client}
        value={selectedAddressId}
        onChange={setSelectedAddressId}
      />

      {/* Sélection des produits */}
      <SelectProducts
        client={client}
        basket={basket}
        setBasket={setBasket}
      />
    </div>
  );
}
