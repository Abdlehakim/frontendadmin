/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/create/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";

import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectAddress, {
  Address,
} from "@/components/create-order/selectAddress";
import SelectDeliveryOption, {
  DeliveryOption,
} from "@/components/create-order/selectDeliveryOption";
import SelectBoutiques, {
  Boutique,
} from "@/components/create-order/SelectBoutiques";
import SelectProducts, {
  BasketItem,
} from "@/components/create-order/selectProducts";
import OrderPreview from "@/components/create-order/OrderPreview";
import OrderStepsNav from "@/components/create-order/OrderStepsNav";

/* ---------- helpers ---------- */
const fmtAddress = (a: Address | null) =>
  a
    ? `${a.Name}, ${a.StreetAddress}, ${a.City} ${a.PostalCode}, ${a.Country}`
    : null;

export default function CreateOrderPage() {
  /* ---------- state ---------- */
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  /* ---------- helpers ---------- */
  const resetAll = () => {
    setClient(null);
    setSelectedAddressId(null);
    setSelectedAddressLbl(null);
    setSelectedBoutiqueId(null);
    setSelectedBoutique(null);
    setDeliveryOpt(null);
    setBasket([]);
    setStep(1);
  };

  const handleAddressChange = useCallback(
    (id: string | null, addr: Address | null) => {
      setSelectedAddressId(id);
      setSelectedAddressLbl(fmtAddress(addr));
    },
    []
  );

  /* ---------- guards ---------- */
  const canGoStep2 = client && basket.length > 0;
  const canGoStep3 =
    deliveryOpt &&
    (deliveryOpt.isPickup
      ? selectedBoutiqueId !== null
      : selectedAddressId !== null);

  /* ---------- render ---------- */
  return (
    <div className="w-[95%] min-h-full mx-auto py-4 flex flex-col gap-8">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase">Créer une commande</h1>
        <Link href="/dashboard/manage-client/orders">
          <button className="h-10 px-4 rounded border border-gray-300 hover:bg-primary hover:text-white">
            Retour
          </button>
        </Link>
      </div>

      {/* barre de progression */}
      <OrderStepsNav currentStep={step} />

      {/* ───────── ÉTAPE 1 ───────── */}
      {step === 1 && (
        <>
          {/* bloc principal avec min-h-[70%] */}
          <div className="min-h-[70%] flex flex-1 flex-col gap-4">
            <SelectClient
              client={client}
              onSelect={setClient}
              onClear={resetAll}
            />

            <SelectProducts
              client={client}
              basket={basket}
              setBasket={setBasket}
            />
          </div>

          {/* navigation */}
          <div className="flex mx-auto justify-center gap-4 w-[40%] py-4">
            <button
              onClick={() => setStep(2)}
              className="h-10 px-6 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
              disabled={!canGoStep2}
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {/* ───────── ÉTAPE 2 ───────── */}
      {step === 2 && (
        <>
          <div className="min-h-[70%] flex flex-1 flex-col gap-6">
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

            {deliveryOpt && !deliveryOpt.isPickup && (
              <SelectAddress
                client={client}
                value={selectedAddressId}
                onChange={handleAddressChange}
              />
            )}

            {deliveryOpt && deliveryOpt.isPickup && (
              <SelectBoutiques
                value={selectedBoutiqueId}
                onChange={(id, b) => {
                  setSelectedBoutiqueId(id);
                  setSelectedBoutique(b);
                }}
              />
            )}
          </div>

          {/* navigation */}
          <div className="flex mx-auto justify-center gap-4 w-[40%] py-4">
            <button
              onClick={() => setStep(1)}
              className="h-10 px-6 rounded border border-gray-300 hover:bg-gray-200"
            >
              ← Précédent
            </button>

            <button
              onClick={() => setStep(3)}
              className="h-10 px-6 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
              disabled={!canGoStep3}
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {/* ───────── ÉTAPE 3 (aperçu) ───────── */}
      {step === 3 && (
        <>
          <div className="min-h-[70%] flex flex-1 flex-col gap-6">
            <OrderPreview
              onClose={() => setStep(2)}
              client={client}
              addressLabel={selectedAddressLbl}
              boutique={selectedBoutique}
              delivery={deliveryOpt}
              basket={basket}
            />
          </div>
          {/* navigation */}
          <div className="flex mx-auto justify-center gap-4 w-[40%] py-4">
            <button
              onClick={() => setStep(2)}
              className="h-10 px-6 rounded border border-gray-300 hover:bg-gray-200"
            >
              ← Précédent
            </button>
          </div>
        </>
      )}
    </div>
  );
}
