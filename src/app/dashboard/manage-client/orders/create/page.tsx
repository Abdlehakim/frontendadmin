/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/create/page.tsx
------------------------------------------------------------------ */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectAddress, {
  Address,
} from "@/components/create-order/selectAddress";
import SelectDeliveryOption, {
  DeliveryOption,
} from "@/components/create-order/selectDeliveryOption";
import SelectMagasins, {
  Magasin,
} from "@/components/create-order/SelectMagasins";
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
  setMagasin,
  setDeliveryOption,
  setPaymentMethod,
  setBasket,
  cachePaymentMethods,
  reset as resetOrderCreation,
  selectOrderCreation,
} from "@/features/orderCreation/orderCreationSlice";


const MIN_CHARS = 2;

export default function CreateOrderPage() {
  const router = useRouter();
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
    selectedMagasinId,
    selectedMagasin,
  } = useAppSelector(selectOrderCreation);

  /* ----- local state ----- */
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [magasinsList, setMagasinsList] = useState<Magasin[]>([]);
  const [loadingMagasins, setLoadingMagasins] = useState(false);

  /* ---------- chargement des options de livraison ---------- */
  useEffect(() => {
    setLoadingDelivery(true);
    (async () => {
      try {
        // on récupère directement un DeliveryOption[]
        const opts = await fetchFromAPI<DeliveryOption[]>(
          "/dashboardadmin/delivery-options"
        );
        setDeliveryOptions(opts);
      } catch (e) {
        console.error("Load delivery options error:", e);
      } finally {
        setLoadingDelivery(false);
      }
    })();
  }, []);

  /* ---------- chargement des magasins (pickup) ---------- */
  useEffect(() => {
    setLoadingMagasins(true);
    (async () => {
      try {
        const { magasins } = await fetchFromAPI<{ magasins: Magasin[] }>(
          "/dashboardadmin/stock/magasins/approved"
        );
        setMagasinsList(magasins);
      } catch (e) {
        console.error("Load magasins error:", e);
      } finally {
        setLoadingMagasins(false);
      }
    })();
  }, []);

  /* ---------- chargement des moyens de paiement ---------- */
  useEffect(() => {
    setLoadingPaymentMethods(true);
    (async () => {
      try {
        const { activePaymentMethods } = await fetchFromAPI<{
          activePaymentMethods: PaymentMethod[];
        }>("/dashboardadmin/payment/payment-settings/active");

        dispatch(cachePaymentMethods(activePaymentMethods));
        setPaymentMethods(activePaymentMethods);
      } catch (e) {
        console.error("Load payment methods error:", e);
      } finally {
        setLoadingPaymentMethods(false);
      }
    })();
  }, [dispatch]);

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
          `/dashboardadmin/clientAddress/${client._id}`
        );
        setAddresses(addresses);
      } catch (e) {
        console.error("Load addresses error:", e);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, [client]);

     const refreshAddresses = useCallback(async () => {
    if (!client?._id) return;
    setLoadingAddresses(true);
    try {
      const { addresses } = await fetchFromAPI<{ addresses: Address[] }>(
        `/dashboardadmin/clientAddress/${client._id}`
      );
      setAddresses(addresses);
    } catch (e) {
      console.error("Refresh addresses error:", e);
    } finally {
      setLoadingAddresses(false);
    }
  }, [client?._id]);

  /* ---------- recherche clients ---------- */
  const searchClients = useCallback(async (q: string): Promise<Client[]> => {
    if (q.trim().length < MIN_CHARS) return [];
    const { clients } = await fetchFromAPI<{ clients: Client[] }>(
      `/dashboardadmin/client/find?q=${encodeURIComponent(q.trim())}`
    );
    return clients;
  }, []);

  /* ---------- recherche produits ---------- */
  const searchProducts = useCallback(
    async (q: string): Promise<ProductLite[]> => {
      if (q.trim().length < MIN_CHARS) return [];
      const { products } = await fetchFromAPI<{ products: ProductLite[] }>(
        `/dashboardadmin/stock/products/find?q=${encodeURIComponent(q.trim())}`
      );
      return products;
    },
    []
  );

  /* ---------- mise à jour du panier ---------- */
  const updateBasket = useCallback(
    (action: React.SetStateAction<BasketItem[]>) => {
      const newBasket = typeof action === "function" ? action(basket) : action;
      dispatch(setBasket(newBasket));
    },
    [basket, dispatch]
  );

  /* ---------- changement de mode de livraison ---------- */
  const handleDeliveryChange = useCallback(
    (_: string | null, opt: DeliveryOption | null) => {
      dispatch(setDeliveryOption(opt));
      if (!opt || opt.isPickup) {
        dispatch(setAddress({ id: null, label: null }));
      } else {
        dispatch(setMagasin({ id: null, magasin: null }));
      }
    },
    [dispatch]
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
    if (deliveryOpt.isPickup) return selectedMagasinId !== null && paymentOK;
    return selectedAddressId !== null && paymentOK;
  })();

  /* ---------- soumission ---------- */
/* ---------- soumission ---------- */
/* ---------- soumission ---------- */
const handleSubmit = useCallback(async () => {
  try {
    const pickupArray =
  deliveryOpt?.isPickup && selectedMagasin
    ? [
        {
          Magasin: selectedMagasin._id,
          MagasinAddress: [selectedMagasin.name, selectedMagasin.address, selectedMagasin.city]
            .filter(Boolean)
            .join(", "),
        },
      ]
    : [];

    const deliveryArray =
      deliveryOpt && !deliveryOpt.isPickup && selectedAddressId
        ? [
            {
              Address: selectedAddressId,
              DeliverToAddress: selectedAddressLbl!,
            },
          ]
        : [];

    const payload = {
      client: client!._id,
      clientName: client!.username ?? client!.name,

       DeliveryAddress: deliveryArray,
  pickupMagasin: pickupArray,

      orderItems: basket.map((it) => ({
        product: it._id,
        reference: it.reference,
        name: it.name,
        tva: it.tva,
        quantity: it.quantity,
        discount: it.discount,
        price: it.price,
        attributes: it.attributes?.map((row) => ({
          attribute: row.attributeSelected._id,
          name: row.attributeSelected.name,
          value: it.chosen[row.attributeSelected._id]!,
        })),
      })),

      // deliveryMethod est "required" dans le schéma
      deliveryMethod: deliveryOpt!.name,
      deliveryCost: deliveryOpt?.price ?? 0,

      paymentMethod: paymentMethodLabel ?? undefined,
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
  selectedMagasin,
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
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white disabled:opacity-50 cursor-pointer"
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
              options={deliveryOptions}
              loading={loadingDelivery}
            />

            {deliveryOpt && !deliveryOpt.isPickup && (
              <SelectAddress
                client={client}
                addresses={addresses}
                value={selectedAddressId}
                onChange={(id, label) => dispatch(setAddress({ id, label }))}
                loading={loadingAddresses}
                  refreshAddresses={refreshAddresses}
              />
            )}

            {deliveryOpt && deliveryOpt.isPickup && (
              <SelectMagasins
                value={selectedMagasinId}
                magasins={magasinsList}
                loading={loadingMagasins}
                onChange={(id, b) => dispatch(setMagasin({ id, magasin: b }))}
              />
            )}

            {deliveryOpt && (
              <SelectPaymentMethod
                value={paymentMethodKey}
                methods={paymentMethods}
                loading={loadingPaymentMethods}
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
              magasin={selectedMagasin}
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
