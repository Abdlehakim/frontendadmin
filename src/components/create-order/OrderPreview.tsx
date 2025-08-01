/* ------------------------------------------------------------------
   components/create-order/OrderPreview.tsx
   Aperçu de la commande (inline, sans fenêtre modale)
------------------------------------------------------------------ */
"use client";

import React from "react";
import { Client } from "./selectClient";
import { DeliveryOption } from "./selectDeliveryOption";
import { Boutique } from "./SelectBoutiques";
import { BasketItem } from "./selectProducts";

/* ---------- props ---------- */
interface OrderPreviewProps {
  onClose(): void;
  client: Client | null;
  addressLabel: string | null;
  boutique: Boutique | null;
  delivery: DeliveryOption | null;
  basket: BasketItem[];
}

/* ---------- helpers ---------- */
const frFmt = (n: number) => n.toFixed(2).replace(".", ",") + " TND";
const today = new Date().toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/* ---------- component ---------- */
const OrderPreview: React.FC<OrderPreviewProps> = ({
  client,
  addressLabel,
  boutique,
  delivery,
  basket,
}) => {
  /* total avec remise */
  const total = basket.reduce((sum, it) => {
    const puRemise =
      it.discount > 0 ? it.price * (1 - it.discount / 100) : it.price;
    return sum + puRemise * it.quantity;
  }, 0);

  return (
    <div className="w-full bg-white rounded-lg p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Prévisualisation de la commande
        </h1>


      </div>

      {/* résumé */}
      <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 text-center md:text-left">
        {/* Client */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Client</p>
          <p className="text-sm font-medium">
            {client
              ? client.username ?? client.email ?? client.phone ?? client._id
              : "—"}
          </p>
        </div>

        {/* Date */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Date de commande</p>
          <p className="text-sm font-medium">{today}</p>
        </div>

        {/* Livraison / Retrait */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {delivery?.isPickup ? "Retrait" : "Livraison"}
          </p>
          <p className="text-sm font-medium">
            {delivery
              ? `${delivery.name} – ${frFmt(delivery.price)}`
              : "—"}
          </p>
        </div>

        {/* Adresse / Boutique */}
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {delivery?.isPickup ? "Boutique" : "Adresse"}
          </p>
          <p className="text-sm font-medium">
            {delivery?.isPickup
              ? boutique
                ? `${boutique.name}${
                    boutique.city ? " – " + boutique.city : ""
                  }`
                : "—"
              : addressLabel ?? "—"}
          </p>
        </div>
      </div>

      {/* Panier */}
      <div>
        {basket.length > 0 ? (
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
              {basket.map((item) => {
                const puRemise =
                  item.discount > 0
                    ? item.price * (1 - item.discount / 100)
                    : item.price;
                const subtotal = puRemise * item.quantity;

                const attrLine =
                  item.attributes && item.attributes.length
                    ? item.attributes
                        .map((row) => {
                          const id = row.attributeSelected._id;
                          const val = item.chosen[id];
                          return val
                            ? `${row.attributeSelected.name} : ${val}`
                            : null;
                        })
                        .filter(Boolean)
                        .join(", ")
                    : "";

                return (
                  <tr key={item._id} className="border-t align-top">
                    {/* Produit + attributs */}
                    <td className="py-1 px-2">
                      <div>{item.name}</div>
                      {attrLine && (
                        <div className="text-xs text-gray-500">{attrLine}</div>
                      )}
                    </td>

                    <td className="py-1 px-2 text-right">{item.quantity}</td>

                    {/* PU remisé + ancien barré */}
                    <td className="py-1 px-2 text-right">
                      {frFmt(puRemise)}
                      {item.discount > 0 && (
                        <span className="ml-1 line-through text-xs text-gray-500">
                          {frFmt(item.price)}
                        </span>
                      )}
                    </td>

                    <td className="py-1 px-2 text-right">
                      {item.discount > 0 ? `${item.discount}%` : "—"}
                    </td>
                    <td className="py-1 px-2 text-right">{item.tva}%</td>

                    {/* Total ligne remisé */}
                    <td className="py-1 px-2 text-right">
                      {frFmt(subtotal)}
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
                <td className="py-1 px-2 text-right">{frFmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-red-500 text-center">Aucun produit ajouté</p>
        )}
      </div>
    </div>
  );
};

export default OrderPreview;
