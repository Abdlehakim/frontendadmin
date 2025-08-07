/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/create/page.tsx
------------------------------------------------------------------ */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectAddress, { Address } from "@/components/create-order/selectAddress";
import SelectDeliveryOption, {
  DeliveryOption,
} from "@/components/create-order/selectDeliveryOption";
import SelectBoutiques from "@/components/create-order/SelectBoutiques";
import SelectProducts, {
  BasketItem,
  ProductLite,
} from "@/components/create-order/selectProducts";
import SelectPaymentMethod, {
  PaymentMethod,
} from "@/components/create-order/SelectPaymentMethod";
import OrderPreview from "@/components/create-order/OrderPreview";
import OrderStepsNav from "@/components/create-order/OrderStepsNav";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setStep,
  setClient,
  setAddress,
  setBoutique,
  setDeliveryOption,
  setPaymentMethod,
  setBasket,
  cachePaymentMethods,
  reset as resetOrderCreation,
  selectOrderCreation,
} from "@/features/orderCreation/orderCreationSlice";

const MIN_CHARS = 2;

export default function CreateOrderPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();

  const {
    step,
    client,
    deliveryOpt,
    paymentMethodKey,
    paymentMethodLabel,
    basket,
    selectedAddressId,
    selectedAddressLbl,
    selectedBoutiqueId,
    selectedBoutique,
    deliveryOptions: cachedDeliveryOpts,
    boutiques: cachedBoutiques,
    paymentMethods: cachedPaymentMethods,
  } = useAppSelector(selectOrderCreation);

  /* ----- local state ----- */
  const [loadingDelivery,         setLoadingDelivery]         = useState(false);
  const [loadingAddresses,        setLoadingAddresses]        = useState(false);
  const [loadingPaymentMethods,   setLoadingPaymentMethods]   = useState(false);
  const [addresses,               setAddresses]               = useState<Address[]>([]);

  /* ---------- chargement des options de livraison ---------- */
  useEffect(() => {
    if (cachedDeliveryOpts.length) return;
    setLoadingDelivery(true);
    (async () => {
      try {
        await fetchFromAPI("/dashboardadmin/delivery-options");
      } catch (e) {
        console.error("Load delivery options error:", e);
      } finally {
        setLoadingDelivery(false);
      }
    })();
  }, [cachedDeliveryOpts.length]);

  /* ---------- chargement des magasins (pickup) ---------- */
  useEffect(() => {
    if (cachedBoutiques.length) return;
    (async () => {
      try {
        await fetchFromAPI("/dashboardadmin/stock/magasins/approved");
      } catch (e) {
        console.error("Load magasins error:", e);
      }
    })();
  }, [cachedBoutiques.length]);

  /* ---------- chargement des moyens de paiement ---------- */
  useEffect(() => {
    if (cachedPaymentMethods.length) return;
    setLoadingPaymentMethods(true);
    (async () => {
      try {
        const { activePaymentMethods } = await fetchFromAPI<{
          activePaymentMethods: PaymentMethod[];
        }>("/dashboardadmin/payment/payment-settings/active");

        dispatch(cachePaymentMethods(activePaymentMethods));
      } catch (e) {
        console.error("Load payment methods error:", e);
      } finally {
        setLoadingPaymentMethods(false);
      }
    })();
  }, [cachedPaymentMethods.length, dispatch]);

  /* ---------- chargement des adresses du client sélectionné ---------- */
  useEffect(() => {
    if (!client) {
      setAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    (async () => {
      try {
        const { addresses } = await fetchFromAPI<{ addresses: Address[] }>(
          `/dashboardadmin/clientAddress/${client._id}`,
        );
        setAddresses(addresses);
      } catch (e) {
        console.error("Load addresses error:", e);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, [client]);

  /* ---------- recherche clients ---------- */
  const searchClients = useCallback(async (q: string): Promise<Client[]> => {
    if (q.trim().length < MIN_CHARS) return [];
    const { clients } = await fetchFromAPI<{ clients: Client[] }>(
      `/dashboardadmin/client/find?q=${encodeURIComponent(q.trim())}`,
    );
    return clients;
  }, []);

  /* ---------- recherche produits ---------- */
  const searchProducts = useCallback(
    async (q: string): Promise<ProductLite[]> => {
      if (q.trim().length < MIN_CHARS) return [];
      const { products } = await fetchFromAPI<{ products: ProductLite[] }>(
        `/dashboardadmin/stock/products/find?q=${encodeURIComponent(q.trim())}`,
      );
      return products;
    },
    [],
  );

  /* ---------- mise à jour du panier ---------- */
  const updateBasket = useCallback(
    (action: React.SetStateAction<BasketItem[]>) => {
      const newBasket = typeof action === "function" ? action(basket) : action;
      dispatch(setBasket(newBasket));
    },
    [basket, dispatch],
  );

  /* ---------- changement de mode de livraison ---------- */
  const handleDeliveryChange = useCallback(
    (_: string | null, opt: DeliveryOption | null) => {
      dispatch(setDeliveryOption(opt));
      if (!opt || opt.isPickup) {
        dispatch(setAddress({ id: null, label: null }));
      } else {
        dispatch(setBoutique({ id: null, boutique: null }));
      }
    },
    [dispatch],
  );

  /* ---------- annuler ---------- */
  const cancelAndReturn = useCallback(() => {
    dispatch(resetOrderCreation());
    router.push("/dashboard/manage-client/orders");
  }, [dispatch, router]);

  /* ---------- conditions de navigation ---------- */
  const canGoStep2 = Boolean(client && basket.length > 0);
  const canGoStep3 = (() => {
    if (!deliveryOpt) return false;
    const paymentOK = Boolean(paymentMethodKey);
    if (deliveryOpt.isPickup) return selectedBoutiqueId !== null && paymentOK;
    return selectedAddressId !== null && paymentOK;
  })();

  /* ---------- soumission ---------- */
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
        },
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

  /* ---------- clear client ---------- */
  const clearSelectedClient = useCallback(() => {
    dispatch(setClient(null));
    dispatch(setAddress({ id: null, label: null }));
    dispatch(setBasket([]));
  }, [dispatch]);

  /* ---------- UI ---------- */
  return (
    <div className="w-[95%] min-h-full mx-auto py-4 flex flex-col gap-8">
      <h1 className="text-2xl font-bold uppercase">Créer une commande</h1>
      <OrderStepsNav currentStep={step} />

      {/* STEP 1 ------------------------------------------------------ */}
      {step === 1 && (
        <>
          <div className="flex-1 flex flex-col gap-4 min-h-[70%]">
            <SelectClient
              client={client}
              searchClients={searchClients}
              onSelect={(c) => dispatch(setClient(c))}
              onClear={clearSelectedClient}
            />

            <SelectProducts
              client={client}
              basket={basket}
              setBasket={updateBasket}
              searchProducts={searchProducts}
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
              disabled={!canGoStep2}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      {/* STEP 2 ------------------------------------------------------ */}
      {step === 2 && (
        <>
          <div className="flex-1 flex flex-col gap-6 min-h-[70%]">
            <SelectDeliveryOption
              value={deliveryOpt?._id ?? null}
              onChange={handleDeliveryChange}
              options={cachedDeliveryOpts}
              loading={loadingDelivery}
            />

            {deliveryOpt && !deliveryOpt.isPickup && (
              <SelectAddress
                client={client}
                addresses={addresses}
                value={selectedAddressId}
                onChange={(id, label) =>
                  dispatch(setAddress({ id, label }))
                }
                loading={loadingAddresses}
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
                methods={cachedPaymentMethods}
                loading={loadingPaymentMethods}
                onChange={(key, method) =>
                  dispatch(
                    setPaymentMethod({ key, label: method?.label ?? null }),
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
                disabled={!canGoStep3}
                className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white disabled:opacity-50 cursor-pointer"
              >
                Suivant →
              </button>
            </div>
          </div>
        </>
      )}

      {/* STEP 3 ------------------------------------------------------ */}
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
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
