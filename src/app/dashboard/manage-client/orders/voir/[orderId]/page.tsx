/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/voir/[orderId]/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types ---------- */
interface OrderItem {
  product: string;
  reference: string;
  name: string;
  mainImageUrl: string;
  quantity: number;
  price: number;
  tva: number;
  discount: number;
}

interface Order {
  _id: string;
  ref: string;
  user: { username?: string; email: string } | null;
  clientName: string;
  DeliveryAddress: Array<{
    Address: string;
    DeliverToAddress: string;
  }>;
  pickupMagasin?: {
    Magasin: string;
    MagasinAddress: string;
  };
  orderItems: OrderItem[];
  paymentMethod?: string;
  deliveryMethod: string;
  deliveryCost?: number;
  orderStatus: string;
  createdAt: string;
}

export default function OrderDetailsPage() {
  const { orderId } = useParams() as { orderId: string };
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- fetch order ---------- */
  useEffect(() => {
    async function fetchOrder() {
      try {
        const { order } = await fetchFromAPI<{ order: Order }>(
          `/dashboardadmin/orders/${orderId}`
        );
        setOrder(order);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!order) return <div className="p-8">Order not found.</div>;

  /* ---------- totals ---------- */
  const total = order.orderItems.reduce((sum, it) => {
    const line = (it.price - it.discount) * it.quantity * (1 + it.tva / 100);
    return sum + line;
  }, 0);

  /* ---------- render ---------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order {order.ref}</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          ← Back
        </button>
      </div>

      {/* summary row */}
      <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 text-center md:text-left py-4">
        {/* N° commande */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">N° de commande</p>
          <p className="text-sm font-medium">{order.ref}</p>
        </div>

        {/* Date */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Date de commande</p>
          <p className="text-sm font-medium">
            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Méthode de livraison */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Méthode de livraison</p>
          <p className="text-sm font-medium">
            {order.deliveryMethod} – {order.deliveryCost?.toFixed(2) ?? "0.00"} TND
          </p>
        </div>

        {/* Moyen de paiement */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Moyen de paiement</p>
          <p className="text-sm font-medium">{order.paymentMethod || "—"}</p>
        </div>

        {/* Retrait en magasin */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Retrait en magasin</p>
          <p className="text-sm font-medium">
            {order.pickupMagasin?.MagasinAddress ?? "—"}
          </p>
        </div>

        {/* Adresse de livraison */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Lieu de livraison</p>
          <div className="space-y-0.5 text-sm font-medium">
            {order.DeliveryAddress.map((addr, idx) => (
              <p key={idx}>{addr.DeliverToAddress}</p>
            ))}
          </div>
        </div>
      </div>

      {/* table des items */}
      <div>
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-1 px-2 text-left">Produit</th>
              <th className="py-1 px-2 text-right">Qté</th>
              <th className="py-1 px-2 text-right">Prix</th>
              <th className="py-1 px-2 text-right">TVA</th>
              <th className="py-1 px-2 text-right">Remise</th>
              <th className="py-1 px-2 text-right">Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems.map((it) => {
              const subtotal =
                (it.price - it.discount) *
                it.quantity *
                (1 + it.tva / 100);
              return (
                <tr key={it.product} className="border-t">
                  <td className="py-1 px-2 text-left">{it.name}</td>
                  <td className="py-1 px-2 text-right">{it.quantity}</td>
                  <td className="py-1 px-2 text-right">
                    {it.price.toFixed(2)}
                  </td>
                  <td className="py-1 px-2 text-right">{it.tva}%</td>
                  <td className="py-1 px-2 text-right">
                    {it.discount.toFixed(2)}
                  </td>
                  <td className="py-1 px-2 text-right">
                    {subtotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td colSpan={5} className="py-1 px-2 text-right">
                Total
              </td>
              <td className="py-1 px-2 text-right">{total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
