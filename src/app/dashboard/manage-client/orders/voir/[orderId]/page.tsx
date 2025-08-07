/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/voir/[orderId]/page.tsx
   Détails de commande : section méta + tableau harmonisés
   MAJ (Août 2025) : pickupMagasin est maintenant un ARRAY
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types ---------- */
interface OrderItem {
  product: string;
  reference: string;
  name: string;
  quantity: number;
  price: number;
  tva: number;
  discount: number;
}

interface Order {
  _id: string;
  ref: string;
  clientName: string;
  DeliveryAddress: Array<{ DeliverToAddress: string }>;
  pickupMagasin: Array<{ MagasinAddress: string }>; // ← array now
  orderItems: OrderItem[];
  paymentMethod?: string;
  deliveryMethod: string;
  deliveryCost?: number;
  createdAt: string;
}

/* ---------- helpers ---------- */
const frFmt = (n: number) => n.toFixed(2).replace(".", ",") + " TND";

export default function OrderDetailsPage() {
  const { orderId } = useParams() as { orderId: string };

  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* fetch order */
  useEffect(() => {
    (async () => {
      try {
        const { order } = await fetchFromAPI<{ order: Order }>(
          `/dashboardadmin/orders/${orderId}`,
        );
        setOrder(order);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading)  return <div className="p-8">Loading…</div>;
  if (!order)   return <div className="p-8">Order not found.</div>;

  /* totals */
  const totalTTC =
    order.orderItems.reduce((s, it) => {
      const puRemise = it.price * (1 - it.discount / 100);
      return s + puRemise * it.quantity;
    }, 0) + (order.deliveryCost ?? 0);

  /* pickup / livraison */
  const pickupList   = order.pickupMagasin ?? [];
  const isPickup     = pickupList.length > 0;
  const addressLabel = order.DeliveryAddress
    .map((a) => a.DeliverToAddress)
    .join("\n");
  const magasinLabel = pickupList
    .map((m) => m.MagasinAddress)
    .join("\n") || "—";

  /* ---------- render ---------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Commande {order.ref}</h1>

        {/* ← Retour vers la liste des commandes */}
        <Link
          href="/dashboard/manage-client/orders"
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          ← Retour
        </Link>
      </div>

      {/* ─── section méta ─── */}
      <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 text-center md:text-left">
        {/* Client */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Client</p>
          <p className="text-sm font-medium">{order.clientName}</p>
        </div>

        {/* Date */}
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

        {/* Livraison / Retrait */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {isPickup ? "Retrait" : "Livraison"}
          </p>
          <p className="text-sm font-medium">
            {order.deliveryMethod} – {frFmt(order.deliveryCost ?? 0)}
          </p>
        </div>

        {/* Paiement */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Paiement</p>
          <p className="text-sm font-medium">
            {order.paymentMethod ?? "—"}
          </p>
        </div>

        {/* Adresse / Magasin */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {isPickup ? "Magasin" : "Adresse"}
          </p>
          <p className="text-sm font-medium whitespace-pre-line">
            {isPickup ? magasinLabel : addressLabel || "—"}
          </p>
        </div>
      </div>

      {/* ─── table articles ─── */}
      <div>
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-1 px-2 text-left">Produit</th>
              <th className="py-1 px-2 text-right">Qté</th>
              <th className="py-1 px-2 text-right">PU&nbsp;TTC</th>
              <th className="py-1 px-2 text-right">Remise</th>
              <th className="py-1 px-2 text-right">TVA</th>
              <th className="py-1 px-2 text-right">Total&nbsp;TTC</th>
            </tr>
          </thead>

          <tbody>
            {order.orderItems.map((it) => {
              const puRemise = it.price * (1 - it.discount / 100);
              const lineTTC  = puRemise * it.quantity;

              return (
                <tr key={it.product} className="border-t align-top">
                  <td className="py-1 px-2">
                    <div>{it.name}</div>
                    <div className="text-xs text-gray-500">
                      {it.reference}
                    </div>
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

          <tfoot>
            <tr className="border-t font-semibold">
              <td colSpan={5} className="py-1 px-2 text-right">
                Total
              </td>
              <td className="py-1 px-2 text-right">{frFmt(totalTTC)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
