/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/update/[orderId]/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectProducts, {
  ProductLite,
  BasketItem,
} from "@/components/create-order/selectProducts";
import SelectDeliveryOption, {
  DeliveryOption,
} from "@/components/create-order/selectDeliveryOption";
import SelectAddress, { Address } from "@/components/create-order/selectAddress";
import SelectBoutiques, {
  Magasin,
} from "@/components/create-order/SelectBoutiques";
import SelectPaymentMethod, {
  PaymentMethod,
} from "@/components/create-order/SelectPaymentMethod";
import OrderPreview from "@/components/create-order/OrderPreview";

const MIN_CHARS = 2;

/* ---------- API types ---------- */
interface OrderResponse {
  order: {
    _id: string;
    client: Client;
    clientName: string;
    paymentMethod?: string;
    deliveryMethod?: string;
    deliveryCost?: number;
    pickupMagasin: Array<{
      Magasin: string;
      MagasinAddress: string;
    }>;
    DeliveryAddress: Array<{
      Address: string;
      DeliverToAddress: string;
    }>;
    orderItems: Array<{
      product: string;
      reference: string;
      name: string;
      price: number;
      tva: number;
      discount: number;
      quantity: number;
      attributes?: ProductLite["attributes"];
    }>;
  };
}

export default function UpdateOrderPage() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();

  /* ---------- local caches ---------- */
  const [boutiques, setBoutiques]         = useState<Magasin[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  /* ---------- local UI state ---------- */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* client & panier */
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);

  /* livraison & paiement */
  const [deliveryOpt, setDeliveryOpt] = useState<DeliveryOption | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  const [paymentMethodKey, setPaymentMethodKey] =
    useState<string | null>(null);
  const [paymentMethodLabel, setPaymentMethodLabel] =
    useState<string | null>(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  /* adresses */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] =
    useState<string | null>(null);
  const [selectedAddressLbl, setSelectedAddressLbl] =
    useState<string | null>(null);

  /* retrait magasin */
  const [selectedBoutiqueId, setSelectedBoutiqueId] =
    useState<string | null>(null);
  const [selectedBoutique, setSelectedBoutique] = useState<Magasin | null>(
    null,
  );

  /* divers */
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* valeur brute de la méthode de paiement stockée sur la commande */
  const [orderPaymentMethodRaw, setOrderPaymentMethodRaw] =
    useState<string | null>(null);

  /* ---------- helpers ---------- */
  const searchClients = useCallback(async (q: string): Promise<Client[]> => {
    if (q.trim().length < MIN_CHARS) return [];
    const { clients } = await fetchFromAPI<{ clients: Client[] }>(
      `/dashboardadmin/client/find?q=${encodeURIComponent(q.trim())}`,
    );
    return clients;
  }, []);

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

  const updateBasket = useCallback(
    (action: React.SetStateAction<BasketItem[]>) => {
      setBasket((prev) =>
        typeof action === "function"
          ? (action as (b: BasketItem[]) => BasketItem[])(prev)
          : action,
      );
    },
    [],
  );

  /* ---------- preload boutiques ---------- */
  useEffect(() => {
    if (boutiques.length) return;
    (async () => {
      try {
        const { magasins }: { magasins: Magasin[] } = await fetchFromAPI(
          "/dashboardadmin/stock/magasins/approved",
        );
        setBoutiques(magasins);
      } catch (e) {
        console.error("Load magasins error:", e);
      }
    })();
  }, [boutiques.length]);

  /* ---------- preload payment methods ---------- */
  useEffect(() => {
    if (paymentMethods.length) return;
    setLoadingPaymentMethods(true);
    (async () => {
      try {
        const { activePaymentMethods } = await fetchFromAPI<{
          activePaymentMethods: PaymentMethod[];
        }>("/dashboardadmin/payment/payment-settings/active");

        setPaymentMethods(activePaymentMethods);
      } catch (e) {
        console.error("Load payment methods error:", e);
      } finally {
        setLoadingPaymentMethods(false);
      }
    })();
  }, [paymentMethods.length]);

  /* ---------- load order + delivery options ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { order } = await fetchFromAPI<OrderResponse>(
          `/dashboardadmin/orders/${orderId}`,
        );
        console.log("Fetched order ➜", order);

        /* client */
        setSelectedClient(order.client);

        /* basket */
        setBasket(
          order.orderItems.map((it) => ({
            _id: it.product,
            name: it.name,
            reference: it.reference,
            price: it.price,
            tva: it.tva,
            discount: it.discount,
            quantity: it.quantity,
            stockStatus: "in stock",
            attributes: it.attributes,
            chosen: {},
          })),
        );

        /* adresse ou magasin */
        if (order.DeliveryAddress?.length) {
          setSelectedAddressId(String(order.DeliveryAddress[0].Address));
          setSelectedAddressLbl(order.DeliveryAddress[0].DeliverToAddress);
        }

        if (order.pickupMagasin?.length) {
          const first = order.pickupMagasin[0];
          const id = String(first.Magasin);
          const boutiqueObj: Magasin = { _id: id, name: first.MagasinAddress };
          setSelectedBoutiqueId(id);
          setSelectedBoutique(boutiqueObj);

          setBoutiques((prev) =>
            prev.some((b) => b._id === id) ? prev : [...prev, boutiqueObj],
          );
        }

        /* stocke la valeur brute pour plus tard */
        setOrderPaymentMethodRaw(order.paymentMethod ?? null);

        /* ----- fetch delivery options ----- */
        setLoadingDelivery(true);
        const data = await fetchFromAPI("/dashboardadmin/delivery-options");
        const mapped: DeliveryOption[] = (Array.isArray(data) ? data : []).map(
          (o) => ({
            _id: String(o._id ?? o.id ?? ""),
            name: o.name,
            description: o.description ?? "",
            price: Number(o.price ?? o.cost ?? 0),
            isPickup: Boolean(o.isPickup),
          }),
        );
        setDeliveryOptions(mapped);

        if (order.deliveryMethod) {
          const found = mapped.find((d) => d.name === order.deliveryMethod);
          if (found) setDeliveryOpt(found);
        }
      } catch {
        setError("Impossible de charger la commande.");
      } finally {
        setLoadingDelivery(false);
      }
    })();
  }, [orderId]);

  /* ---------- applique la méthode de paiement une fois la liste dispo ---------- */
  useEffect(() => {
    if (!orderPaymentMethodRaw || !paymentMethods.length) return;

    const found =
      paymentMethods.find(
        (m) =>
          m.label === orderPaymentMethodRaw ||
          m.name === orderPaymentMethodRaw,
      ) ?? null;

    if (found) {
      setPaymentMethodKey(found.name);
      setPaymentMethodLabel(found.label);
    }
  }, [paymentMethods, orderPaymentMethodRaw]);

  /* ---------- fetch adresses ---------- */
  useEffect(() => {
    if (!selectedClient) {
      setAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    (async () => {
      try {
        const { addresses } = await fetchFromAPI<{ addresses: Address[] }>(
          `/dashboardadmin/clientAddress/${selectedClient._id}`,
        );
        setAddresses(addresses);
      } catch (e) {
        console.error("Load addresses error:", e);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, [selectedClient]);

  /* ---------- actions ---------- */
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

          /* --- livraison / retrait --- */
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
            deliveryOpt && deliveryOpt.isPickup && selectedBoutique
              ? [
                  {
                    Magasin: selectedBoutique._id,
                    MagasinAddress: selectedBoutique.name,
                  },
                ]
              : [],

          paymentMethod: paymentMethodLabel,

          /* --- produits --- */
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
        }),
      });
      router.push(`/dashboard/manage-client/orders/voir/${orderId}`);
    } catch {
      setError("Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- guards ---------- */
  const paymentOK  = Boolean(paymentMethodKey);
  const canGoStep2 = basket.length > 0;
  const canGoStep3 =
    canGoStep2 &&
    deliveryOpt &&
    paymentOK &&
    (deliveryOpt.isPickup
      ? selectedBoutiqueId !== null
      : selectedAddressId !== null);

  if (error) return <p className="text-red-600">{error}</p>;

  /* ---------- UI ---------- */
  return (
    <div className="w-[95%] mx-auto py-6 flex flex-col gap-8">
      <h1 className="text-2xl font-bold uppercase">Modifier la commande</h1>

      {/* STEP 1 ------------------------------------------------------ */}
      {step === 1 && (
        <>
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

          <div className="flex gap-4">
            <button
              onClick={cancel}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!canGoStep2}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      {/* STEP 2 ------------------------------------------------------ */}
      {step === 2 && (
        <>
          <SelectDeliveryOption
            value={deliveryOpt?._id ?? null}
            onChange={(_, opt) => {
              setDeliveryOpt(opt);
              if (opt?.isPickup) {
                setSelectedAddressId(null);
                setSelectedAddressLbl(null);
              } else {
                setSelectedBoutiqueId(null);
                setSelectedBoutique(null);
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

          {deliveryOpt && deliveryOpt.isPickup && (
            <SelectBoutiques
              value={selectedBoutiqueId}
              onChange={(id, b) => {
                setSelectedBoutiqueId(id);
                setSelectedBoutique(b ?? null);
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

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canGoStep3}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      {/* STEP 3 ------------------------------------------------------ */}
      {step === 3 && (
        <>
          <OrderPreview
            onClose={() => setStep(2)}
            client={selectedClient}
            addressLabel={selectedAddressLbl}
            magasin={selectedBoutique}
            delivery={deliveryOpt}
            basket={basket}
            paymentMethod={paymentMethodLabel}
          />

          <div className="flex gap-4">
            <button
              onClick={cancel}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={() => setStep(2)}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white"
            >
              ← Précédent
            </button>
            <button
              onClick={save}
              disabled={saving || !canGoStep3}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
