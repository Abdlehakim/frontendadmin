/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/create/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";

import SelectClient from "@/components/create-order/selectClient";
import SelectAddress from "@/components/create-order/selectAddress";
import SelectDeliveryOption, {
  DeliveryOption,
} from "@/components/create-order/selectDeliveryOption";
import SelectBoutiques from "@/components/create-order/SelectBoutiques";
import SelectProducts, {
  BasketItem,
} from "@/components/create-order/selectProducts";
import SelectPaymentMethod from "@/components/create-order/SelectPaymentMethod";
import OrderPreview from "@/components/create-order/OrderPreview";
import OrderStepsNav from "@/components/create-order/OrderStepsNav";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- redux ---------- */
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setStep,
  setClient,
  setAddress,
  setBoutique,
  setDeliveryOption,
  setPaymentMethod,
  setBasket,
  reset as resetOrderCreation,
  selectOrderCreation,
} from "@/features/orderCreation/orderCreationSlice";

export default function CreateOrderPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  /* ---------- state ---------- */
  const {
    step,
    client,
    selectedAddressId,
    selectedAddressLbl,
    selectedBoutiqueId,
    selectedBoutique,
    deliveryOpt,
    paymentMethodKey,
    paymentMethodLabel,
    basket,
  } = useAppSelector(selectOrderCreation);

  /* ---------- helpers ---------- */
  const fmtAddress = (
    a: import("@/components/create-order/selectAddress").Address | null
  ) =>
    a
      ? `${a.Name}, ${a.StreetAddress}, ${a.City} ${a.PostalCode}, ${a.Country}`
      : null;

  const handleAddressChange = useCallback(
    (
      id: string | null,
      addr: import("@/components/create-order/selectAddress").Address | null
    ) => dispatch(setAddress({ id, label: fmtAddress(addr) })),
    [dispatch]
  );

  const updateBasket = useCallback(
    (action: React.SetStateAction<BasketItem[]>) => {
      const newBasket = typeof action === "function" ? action(basket) : action;
      dispatch(setBasket(newBasket));
    },
    [basket, dispatch]
  );

  const handleDeliveryChange = useCallback(
    (_id: string | null, opt: DeliveryOption | null) => {
      dispatch(setDeliveryOption(opt));
      if (!opt || opt.isPickup) {
        dispatch(setAddress({ id: null, label: null }));
      } else {
        dispatch(setBoutique({ id: null, boutique: null }));
      }
    },
    [dispatch]
  );

  /* ---------- cancel ---------- */
  const cancelAndReturn = useCallback(() => {
    dispatch(resetOrderCreation());
    router.push("/dashboard/manage-client/orders");
  }, [dispatch, router]);

  /* ---------- guards ---------- */
  const canGoStep2 = Boolean(client && basket.length > 0);

  const canGoStep3 = (() => {
    if (!deliveryOpt) return false;
    const paymentOK = Boolean(paymentMethodKey);
    if (deliveryOpt.isPickup) return selectedBoutiqueId !== null && paymentOK;
    return selectedAddressId !== null && paymentOK;
  })();

  /* ---------- submit ---------- */
  const handleSubmit = useCallback(async () => {
    try {
      const payload = {
        client: client!._id,
        clientName: client!.username ?? client!.name,
        DeliveryAddress:
          deliveryOpt && !deliveryOpt.isPickup && selectedAddressId
            ? [
                {
                  Address: selectedAddressId,
                  DeliverToAddress: selectedAddressLbl!,
                },
              ]
            : [],
        pickupMagasin:
          deliveryOpt && deliveryOpt.isPickup && selectedBoutique
            ? {
                Magasin: selectedBoutique._id,
                MagasinAddress: selectedBoutique.name,
              }
            : {},
        orderItems: basket.map((it) => ({
          product: it._id,
          reference: it.reference,
          name: it.name,
          tva: it.tva,
          quantity: it.quantity,
          discount: it.discount,
          price: it.price,
          attributes: it.attributes,
        })),
        deliveryMethod: deliveryOpt?.name,
        deliveryCost: deliveryOpt?.price,
        paymentMethod: paymentMethodLabel,
      };

      const { order } = await fetchFromAPI<{ order: { _id: string } }>(
        "/dashboardadmin/orders/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      dispatch(resetOrderCreation());
      router.push(`/dashboard/manage-client/orders/voir/${order._id}`);
    } catch (err) {
      console.error("Order submission failed:", err);
      alert("Échec de la soumission de la commande.");
    }
  }, [
    client,
    selectedAddressId,
    selectedAddressLbl,
    selectedBoutique,
    deliveryOpt,
    basket,
    router,
    paymentMethodLabel,
    dispatch,
  ]);

  /* ---------- render ---------- */
  return (
    <div className="w-[95%] min-h-full mx-auto py-4 flex flex-col gap-8">
      {/* header */}
      <h1 className="text-2xl font-bold uppercase">Créer une commande</h1>

      {/* progression */}
      <OrderStepsNav currentStep={step} />

      {/* ───────── STEP 1 ───────── */}
      {step === 1 && (
        <>
          <div className="flex-1 flex flex-col gap-4 min-h-[70%]">
            <SelectClient
              client={client}
              onSelect={(c) => dispatch(setClient(c))}
              onClear={cancelAndReturn}
            />
            <SelectProducts
              client={client}
              basket={basket}
              setBasket={updateBasket}
            />
          </div>

          <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
            <button
              onClick={cancelAndReturn}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
            >
              Annuler
            </button>

            <button
              onClick={() => dispatch(setStep(2))}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
              disabled={!canGoStep2}
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {/* ───────── STEP 2 ───────── */}
      {step === 2 && (
        <>
          <div className="flex-1 flex flex-col gap-6 min-h-[70%]">
            <SelectDeliveryOption
              value={deliveryOpt?._id ?? null}
              onChange={handleDeliveryChange}
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
                onChange={(id, b) => dispatch(setBoutique({ id, boutique: b }))}
              />
            )}

            {deliveryOpt && (
              <SelectPaymentMethod
                value={paymentMethodKey}
                onChange={(key, method) =>
                  dispatch(
                    setPaymentMethod({ key, label: method?.label ?? null })
                  )
                }
              />
            )}
          </div>

          <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
            <button
              onClick={cancelAndReturn}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
            >
              Annuler
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => dispatch(setStep(1))}
                className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
              >
                ← Précédent
              </button>

              <button
                onClick={() => dispatch(setStep(3))}
                className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
                disabled={!canGoStep3}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}

      {/* ───────── STEP 3 ───────── */}
      {step === 3 && (
        <>
          <div className="flex-1 flex flex-col gap-6 min-h-[70%]">
            <OrderPreview
              onClose={() => dispatch(setStep(2))}
              client={client}
              addressLabel={selectedAddressLbl}
              magasin={selectedBoutique}
              delivery={deliveryOpt}
              basket={basket}
              paymentMethod={paymentMethodLabel}
            />
          </div>

          <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
            <button
              onClick={cancelAndReturn}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
            >
              Annuler
            </button>
            <div className="flex gap-4">
            <button
              onClick={() => dispatch(setStep(2))}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
            >
              ← Précédent
            </button>

            <button
              onClick={handleSubmit}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
            >
              Confirmer la commande
            </button></div>
          </div>
        </>
      )}
    </div>
  );
}
