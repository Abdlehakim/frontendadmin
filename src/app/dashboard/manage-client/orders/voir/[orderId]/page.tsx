/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/voir/[orderId]/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types (mirror backend model) ---------- */
interface OrderItemAttribute {
  attribute: string;
  name: string;
  value: string;
}

interface OrderItem {
  product: string;
  reference: string;
  name: string;
  quantity: number;
  price: number;     // TTC (unit)
  tva: number;
  discount: number;  // %
  attributes?: OrderItemAttribute[];
}

interface DeliveryAddressRow {
  AddressID: string;
  DeliverToAddress: string;
}

interface PickupMagasinRow {
  MagasinID: string;
  MagasinName?: string;
  MagasinAddress: string;
}

interface PaymentMethodRow {
  PaymentMethodID: string;
  PaymentMethodLabel: string;
}

interface DeliveryMethodRow {
  deliveryMethodID: string;
  deliveryMethodName?: string;
  Cost: string; // stored as string in model
  expectedDeliveryDate?: string;
}

interface Order {
  _id: string;
  ref?: string;
  clientName: string;

  DeliveryAddress: DeliveryAddressRow[];
  pickupMagasin: PickupMagasinRow[];

  paymentMethod: PaymentMethodRow[];
  deliveryMethod: DeliveryMethodRow[];

  orderItems: OrderItem[];

  orderStatus?: string;
  createdAt: string;
}

/* ---------- helpers ---------- */
const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const frFmt = (n: number) => `${n.toFixed(2).replace(".", ",")} TND`;

export default function OrderDetailsPage() {
  const { orderId } = useParams() as { orderId: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* fetch order */
  useEffect(() => {
    (async () => {
      try {
        const { order } = await fetchFromAPI<{ order: Order }>(
          `/dashboardadmin/orders/${orderId}`
        );
        setOrder(order);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!order) return <div className="p-8">Order not found.</div>;

  /* delivery cost (sum all selected delivery methods) */
  const deliveryCostTotal = (order.deliveryMethod ?? []).reduce(
    (s, r) => s + toNumber(r.Cost),
    0
  );

  /* totals (sum lines + delivery) */
  const totalLinesTTC = order.orderItems.reduce((s, it) => {
    const puRemise = it.price * (1 - it.discount / 100);
    return s + puRemise * it.quantity;
  }, 0);
  const totalTTC = totalLinesTTC + deliveryCostTotal;

  /* livraison vs retrait */
  const pickupList = order.pickupMagasin ?? [];
  const isPickup = pickupList.length > 0;

  const addressLabel =
    order.DeliveryAddress?.map((a) => a.DeliverToAddress).join("\n") || "—";
  const magasinLabel =
    pickupList
      .map((m) =>
        m.MagasinName ? `${m.MagasinName} — ${m.MagasinAddress}` : m.MagasinAddress
      )
      .join("\n") || "—";

  /* labels */
  const paymentLabel =
    order.paymentMethod?.map((p) => p.PaymentMethodLabel).join(", ") || "—";

  const deliveryLabel =
    order.deliveryMethod?.length
      ? order.deliveryMethod
          .map((d) => {
            const cost = frFmt(toNumber(d.Cost));
            const date = d.expectedDeliveryDate
              ? new Date(d.expectedDeliveryDate).toLocaleDateString("fr-FR")
              : "";
            const name = d.deliveryMethodName ?? "—";
            return date ? `${name} – ${cost} · ${date}` : `${name} – ${cost}`;
          })
          .join("\n")
      : "—";

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Commande {order.ref ?? order._id}
        </h1>

        <Link
          href="/dashboard/manage-client/orders"
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          ← Retour
        </Link>
      </div>

      {/* section méta */}
      <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 text-center md:text-left">
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Client</p>
          <p className="text-sm font-medium">{order.clientName}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Date</p>
          <p className="text-sm font-medium">
            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {isPickup ? "Retrait" : "Livraison"}
          </p>
          <p className="text-sm font-medium whitespace-pre-line">
            {deliveryLabel}
          </p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Paiement</p>
          <p className="text-sm font-medium">{paymentLabel}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {isPickup ? "Magasin" : "Adresse"}
          </p>
          <p className="text-sm font-medium whitespace-pre-line">
            {isPickup ? magasinLabel : addressLabel}
          </p>
        </div>
      </div>


      <div className="">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-1 px-2 text-left">Produit</th>
              <th className="py-1 px-2 text-right">Qté</th>
              <th className="py-1 px-2 text-right">PU TTC</th>
              <th className="py-1 px-2 text-right">Remise</th>
              <th className="py-1 px-2 text-right">TVA</th>
              <th className="py-1 px-2 text-right">Total TTC</th>
            </tr>
          </thead>

          <tbody>
            {order.orderItems.map((it) => {
              const puRemise = it.price * (1 - it.discount / 100);
              const lineTTC = puRemise * it.quantity;

              const attrLine = it.attributes?.length
                ? it.attributes.map((row) => `${row.name} : ${row.value}`).join(", ")
                : "";

              return (
                <tr key={it.product} className="border-t align-top">
                  <td className="py-1 px-2">
                    <div>{it.name}</div>
                    <div className="text-xs text-gray-500">{it.reference}</div>
                    {attrLine && (
                      <div className="text-xs text-gray-500">{attrLine}</div>
                    )}
                  </td>
                  <td className="py-1 px-2 text-right">{it.quantity}</td>
                  <td className="py-1 px-2 text-right">
                    {frFmt(puRemise)}
                    {it.discount > 0 && (
                      <span className="ml-1 line-through text-xs text-gray-500">
                        {frFmt(it.price)}
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2 text-right">
                    {it.discount > 0 ? `${it.discount}%` : "—"}
                  </td>
                  <td className="py-1 px-2 text-right">{it.tva}%</td>
                  <td className="py-1 px-2 text-right">{frFmt(lineTTC)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totaux séparés */}
        <table className="w-fit text-sm border border-gray-200 border-t-0 ">
          <tbody>
            <tr className="bg-primary">
              <td colSpan={5} className="py-1 px-2 text-right text-gray-600">
                Sous-total articles
              </td>
              <td className="py-1 px-2 text-right">{frFmt(totalLinesTTC)}</td>
            </tr>
            <tr className="">
              <td colSpan={5} className="py-1 px-2 text-right text-gray-600">
                Frais de livraison
              </td>
              <td className="py-1 px-2 text-right">{frFmt(deliveryCostTotal)}</td>
            </tr>
            <tr className="font-semibold">
              <td colSpan={5} className="py-1 px-2 text-right">
                Total
              </td>
              <td className="py-1 px-2 text-right">{frFmt(totalTTC)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
