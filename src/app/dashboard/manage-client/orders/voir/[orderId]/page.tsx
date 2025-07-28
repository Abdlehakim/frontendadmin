// src/app/dashboard/manage-client/orders/voir/[orderId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

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
  DeliveryAddress: Array<{
    Address: string;
    DeliverToAddress: string;
  }>;
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

  const total = order.orderItems.reduce((sum, item) => {
    const line = (item.price - item.discount) * item.quantity * (1 + item.tva / 100);
    return sum + line;
  }, 0);

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6">
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
        {/* Order # */}
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

        {/* Delivery */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Méthode de livraison</p>
          <p className="text-sm font-medium">
            {order.deliveryMethod} – {order.deliveryCost?.toFixed(2) ?? "0.00"}
          </p>
        </div>

        {/* Payment */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Moyen de paiement</p>
          <p className="text-sm font-medium">{order.paymentMethod || "—"}</p>
        </div>

        {/* Delivery address */}
        <div className="flex-1 px-4 flex flex-col space-y-1">
          <p className="text-xs text-gray-400">Lieu de livraison</p>
          <div className="space-y-0.5 text-sm font-medium">
            {order.DeliveryAddress.map((da, idx) => (
              <p key={idx}>{da.DeliverToAddress}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Items</h2>
        <table className="table-fixed w-full border-collapse">
          <thead className="bg-primary text-white">
            <tr>
              <th className="p-2">Image</th>
              <th className="p-2">Name</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">TVA</th>
              <th className="p-2">Discount</th>
              <th className="p-2">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.orderItems.map((item) => {
              const subtotal =
                (item.price - item.discount) *
                item.quantity *
                (1 + item.tva / 100);
              return (
                <tr key={item.product}>
                  <td className="p-2">
                    {item.mainImageUrl && (
                      <Image
                        src={item.mainImageUrl}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-center">
                    {item.price.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">{item.tva}%</td>
                  <td className="p-2 text-center">
                    {item.discount.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    {subtotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="text-lg flex items-center pl-4 font-semibold h-10 bg-primary text-white">
        <span>Total : </span>&nbsp;{total.toFixed(2)}
      </div>
    </div>
  );
}
