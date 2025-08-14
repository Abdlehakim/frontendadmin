/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/update/[orderId]/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

import OrderStepsNav from "@/components/create-order/OrderStepsNav";
import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectProducts, {
  ProductLite,
  BasketItem,
} from "@/components/create-order/selectProducts";
import SelectDeliveryOption, {
  DeliveryOption,
} from "@/components/create-order/selectDeliveryOption";
import SelectAddress, {
  Address,
} from "@/components/create-order/selectAddress";
import SelectMagasins, {
  Magasin,
} from "@/components/create-order/SelectMagasins";
import SelectPaymentMethod, {
  PaymentMethod,
} from "@/components/create-order/SelectPaymentMethod";
import OrderPreview from "@/components/create-order/OrderPreview";

const MIN_CHARS = 2;

/* ---------- helpers ---------- */
const formatMagasinAddress = (m: Magasin) =>
  [m.name, m.address, m.city].filter(Boolean).join(", ");

interface RawAttribute {
  attribute: string;
  name: string;
  value: string;
}

interface OrderResponse {
  order: {
    _id: string;
    client: Client;
    clientName: string;
    paymentMethod?: string;
    deliveryMethod?: string;
    deliveryCost?: number;
    pickupMagasin: Array<{ Magasin: string; MagasinAddress: string }>;
    DeliveryAddress: Array<{ Address: string; DeliverToAddress: string }>;
    orderItems: Array<{
      product: string;
      reference: string;
      name: string;
      price: number;
      tva: number;
      discount: number;
      quantity: number;
      attributes?: RawAttribute[];
    }>;
  };
}

export default function UpdateOrderPage() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);

  const [deliveryOpt, setDeliveryOpt] = useState<DeliveryOption | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodKey, setPaymentMethodKey] = useState<string | null>(null);
  const [paymentMethodLabel, setPaymentMethodLabel] = useState<string | null>(
    null
  );
  const [orderPaymentMethodRaw, setOrderPaymentMethodRaw] = useState<
    string | null
  >(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [selectedAddressLbl, setSelectedAddressLbl] = useState<string | null>(
    null
  );
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [loadingMagasins, setLoadingMagasins] = useState(false);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [selectedMagasinId, setSelectedMagasinId] = useState<string | null>(
    null
  );
  const [selectedMagasin, setSelectedMagasin] = useState<Magasin | null>(
    null
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const searchClients = useCallback(async (q: string): Promise<Client[]> => {
    if (q.trim().length < MIN_CHARS) return [];
    const { clients } = await fetchFromAPI<{ clients: Client[] }>(
      `/dashboardadmin/client/find?q=${encodeURIComponent(q.trim())}`
    );
    return clients;
  }, []);

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

  const updateBasket = useCallback(
    (action: React.SetStateAction<BasketItem[]>) => {
      setBasket((prev) =>
        typeof action === "function"
          ? (action as (b: BasketItem[]) => BasketItem[])(prev)
          : action
      );
    },
    []
  );

  /* Magasins list */
  useEffect(() => {
    if (!magasins.length) {
      setLoadingMagasins(true);
      fetchFromAPI<{ magasins: Magasin[] }>(
        "/dashboardadmin/stock/magasins/approved"
      )
        .then(({ magasins }) => setMagasins(magasins))
        .catch((e) => console.error("Load magasins error:", e))
        .finally(() => setLoadingMagasins(false));
    }
  }, [magasins.length]);

  /* Enrich selected magasin when full list is available */
  useEffect(() => {
    if (!selectedMagasinId || !magasins.length) return;
    const full = magasins.find((b) => b._id === selectedMagasinId);
    if (full) setSelectedMagasin(full);
  }, [magasins, selectedMagasinId]);

  /* Payment methods */
  useEffect(() => {
    if (!paymentMethods.length) {
      setLoadingPaymentMethods(true);
      fetchFromAPI<{ activePaymentMethods: PaymentMethod[] }>(
        "/dashboardadmin/payment/payment-settings/active"
      )
        .then(({ activePaymentMethods }) =>
          setPaymentMethods(activePaymentMethods)
        )
        .catch((e) => console.error("Load payment methods error:", e))
        .finally(() => setLoadingPaymentMethods(false));
    }
  }, [paymentMethods.length]);

  /* Load order */
  useEffect(() => {
    (async () => {
      try {
        const { order } = await fetchFromAPI<OrderResponse>(
          `/dashboardadmin/orders/${orderId}`
        );
        setSelectedClient(order.client);

        const productsDefs = await Promise.all(
          order.orderItems.map((it) =>
            fetchFromAPI<{ products: ProductLite[] }>(
              `/dashboardadmin/stock/products/find?q=${encodeURIComponent(
                it.reference
              )}`
            ).then((res) => res.products[0])
          )
        );

      setBasket(
  order.orderItems.map((it, idx) => {
    const prodDef = productsDefs[idx];

    const chosen: Record<string, string> = {};
    (it.attributes || []).forEach((attr) => {
      chosen[attr.attribute] = attr.value;
    });
    const attrs: BasketItem["attributes"] = (prodDef?.attributes ?? []) as BasketItem["attributes"];

    return {
      _id: it.product,
      name: it.name,
      reference: it.reference,
      price: it.price,
      tva: it.tva,
      discount: it.discount,
      quantity: it.quantity,
      stockStatus: "in stock",
      attributes: attrs,
      chosen,
    };
  })
);

        if (order.DeliveryAddress?.length) {
          setSelectedAddressId(String(order.DeliveryAddress[0].Address));
          setSelectedAddressLbl(order.DeliveryAddress[0].DeliverToAddress);
        }

        if (order.pickupMagasin?.length) {
          const first = order.pickupMagasin[0];
          const id = String(first.Magasin);
          const magasinSeed: Magasin = { _id: id, name: first.MagasinAddress };
          setSelectedMagasinId(id);
          setSelectedMagasin(magasinSeed);

          setMagasins((prev) =>
            prev.some((b) => b._id === id) ? prev : [...prev, magasinSeed]
          );
        }

        setOrderPaymentMethodRaw(order.paymentMethod ?? null);

        setLoadingDelivery(true);
        const data = await fetchFromAPI("/dashboardadmin/delivery-options");
        const mapped: DeliveryOption[] = (Array.isArray(data) ? data : []).map(
          (o) => ({
            _id: String(o._id ?? o.id ?? ""),
            name: o.name,
            description: o.description ?? "",
            price: Number(o.price ?? o.cost ?? 0),
            isPickup: Boolean(o.isPickup),
          })
        );
        setDeliveryOptions(mapped);

        const selected = mapped.find((d) => d.name === order.deliveryMethod);
        if (selected) setDeliveryOpt(selected);
      } catch {
        setError("Impossible de charger la commande.");
      } finally {
        setLoadingDelivery(false);
      }
    })();
  }, [orderId]);

  /* Map raw payment method to current methods */
  useEffect(() => {
    if (orderPaymentMethodRaw && paymentMethods.length) {
      const found = paymentMethods.find(
        (m) =>
          m.label === orderPaymentMethodRaw || m.name === orderPaymentMethodRaw
      );
      if (found) {
        setPaymentMethodKey(found.name);
        setPaymentMethodLabel(found.label);
      }
    }
  }, [paymentMethods, orderPaymentMethodRaw]);

  /* Load addresses for selected client */
  useEffect(() => {
    if (!selectedClient) {
      setAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    fetchFromAPI<{ addresses: Address[] }>(
      `/dashboardadmin/clientAddress/${selectedClient._id}`
    )
      .then(({ addresses }) => setAddresses(addresses))
      .catch((e) => console.error("Load addresses error:", e))
      .finally(() => setLoadingAddresses(false));
  }, [selectedClient]);

  const cancel = () => router.back();

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fetchFromAPI(`/dashboardadmin/orders/update/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient?._id ?? null,
          deliveryMethod: deliveryOpt?.name ?? null,
          deliveryCost: deliveryOpt?.price ?? null,
          DeliveryAddress:
            deliveryOpt && !deliveryOpt.isPickup && selectedAddressId
              ? [
                  {
                    Address: selectedAddressId,
                    DeliverToAddress: selectedAddressLbl,
                  },
                ]
              : [],
          pickupMagasin:
            deliveryOpt && deliveryOpt.isPickup && selectedMagasin
              ? [
                  {
                    Magasin: selectedMagasin._id,
                    // 👇 store "name, address, city"
                    MagasinAddress: formatMagasinAddress(selectedMagasin),
                  },
                ]
              : [],
          paymentMethod: paymentMethodLabel,
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
        }),
      });
      router.push(`/dashboard/manage-client/orders/voir/${orderId}`);
    } catch {
      setError("Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const paymentOK = Boolean(paymentMethodKey);
  const canGoStep2 = basket.length > 0;
  const canGoStep3 =
    canGoStep2 &&
    deliveryOpt &&
    paymentOK &&
    (deliveryOpt.isPickup ? selectedMagasinId : selectedAddressId);

  if (error) return <p className="text-red-600">{error}</p>;

  /* ---------- UI ---------- */
  return (
    <div className="w-[95%] min-h-full mx-auto py-4 flex flex-col gap-8">
      <h1 className="text-2xl font-bold uppercase">Modifier la commande</h1>
      <OrderStepsNav currentStep={step} />

      {/* STEP 1: Client + Produits */}
      {step === 1 && (
        <>
          <div className="flex-1 flex flex-col gap-4 min-h-[70%]">
            <SelectClient
              client={selectedClient}
              searchClients={searchClients}
              onSelect={setSelectedClient}
              onClear={() => setSelectedClient(null)}
            />

            <SelectProducts
              client={selectedClient}
              basket={basket}
              setBasket={updateBasket}
              searchProducts={searchProducts}
            />
          </div>

          <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
            <button
              onClick={cancel}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!canGoStep2}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      {/* STEP 2: Livraison + Paiement */}
      {step === 2 && (
        <>
          <div className="flex-1 flex flex-col gap-6 min-h-[70%]">
            <SelectDeliveryOption
              value={deliveryOpt?._id ?? null}
              onChange={(_, opt) => {
                setDeliveryOpt(opt);
                if (opt?.isPickup) {
                  setSelectedAddressId(null);
                  setSelectedAddressLbl(null);
                } else {
                  setSelectedMagasinId(null);
                  setSelectedMagasin(null);
                }
              }}
              options={deliveryOptions}
              loading={loadingDelivery}
            />

            {deliveryOpt && !deliveryOpt.isPickup && (
              <SelectAddress
                client={selectedClient}
                addresses={addresses}
                value={selectedAddressId}
                onChange={(id, label) => {
                  setSelectedAddressId(id);
                  setSelectedAddressLbl(label);
                }}
                loading={loadingAddresses}
              />
            )}

            {deliveryOpt?.isPickup && (
              <SelectMagasins
                value={selectedMagasinId}
                magasins={magasins}
                loading={loadingMagasins}
                onChange={(id, b) => {
                  setSelectedMagasinId(id);
                  setSelectedMagasin(b ?? null);
                }}
              />
            )}

            {deliveryOpt && (
              <SelectPaymentMethod
                value={paymentMethodKey}
                methods={paymentMethods}
                loading={loadingPaymentMethods}
                onChange={(key, method) => {
                  setPaymentMethodKey(key);
                  setPaymentMethodLabel(method?.label ?? null);
                }}
              />
            )}
          </div>

          <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
            <button
              onClick={cancel}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white"
            >
              Annuler
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white"
              >
                ← Précédent
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canGoStep3}
                className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white disabled:opacity-50"
              >
                Suivant →
              </button>
            </div>
          </div>
        </>
      )}

      {/* STEP 3: Aperçu */}
      {step === 3 && (
        <>
          <div className="flex-1 flex flex-col gap-6 min-h-[70%]">
            <OrderPreview
              onClose={() => setStep(2)}
              client={selectedClient}
              addressLabel={selectedAddressLbl}
              magasin={selectedMagasin}
              delivery={deliveryOpt}
              basket={basket}
              paymentMethod={paymentMethodLabel}
            />
          </div>

          <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
            <button
              onClick={cancel}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white"
            >
              Annuler
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white"
              >
                ← Précédent
              </button>
              <button
                onClick={save}
                disabled={saving || !canGoStep3}
                className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
