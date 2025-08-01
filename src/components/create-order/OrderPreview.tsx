/* ------------------------------------------------------------------
   components/create-order/OrderPreview.tsx
   Aperçu de la commande + génération PDF du devis
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Client } from "./selectClient";
import { DeliveryOption } from "./selectDeliveryOption";
import { Boutique } from "./SelectBoutiques";
import { BasketItem } from "./selectProducts";
import QuoteProforma from "./QuoteProforma";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types ---------- */
interface CompanyInfo {
  name: string;
  logoImageUrl: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  zipcode: number;
}

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
  /* ---------- société (logo / coordonnées) ---------- */
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    fetchFromAPI<CompanyInfo>("/website/header/getHeaderData")
      .then((data) => setCompany(data))
      .catch(() => {});
  }, []);

  /* ---------- totaux ---------- */
  const total = basket.reduce((sum, it) => {
    const puRemise =
      it.discount > 0 ? it.price * (1 - it.discount / 100) : it.price;
    return sum + puRemise * it.quantity;
  }, 0);

  /* ---------- génération PDF ---------- */
  const handleDownloadQuote = useCallback(async () => {
    const el = document.getElementById("quote-to-download");
    if (!el) return;

    // délai pour s'assurer que le rendu hors-écran est terminé
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(el, { useCORS: true });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const imgW = 210;
    const imgH = (canvas.height * imgW) / canvas.width;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgW, imgH);
    pdf.save(`DEVIS-${today.replace(/\s/g, "-")}.pdf`);
  }, []);

  /* ---------- UI ---------- */
  return (
    <div className="w-full bg-white rounded-lg p-6 space-y-6">
      {/* ---------- Header aperçu ---------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prévisualisation de la commande</h1>
      </div>

      {/* ---------- Métadonnées ---------- */}
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
          <p className="text-xs text-gray-400">Date</p>
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

      {/* ---------- Panier ---------- */}
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
                    <td className="py-1 px-2 text-right">{frFmt(subtotal)}</td>
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

      {/* ---------- Bouton téléchargement ---------- */}
      <div className="pt-6 flex justify-end">
        <button
          onClick={handleDownloadQuote}
          className="h-10 px-6 rounded bg-primary text-white hover:opacity-90"
        >
          Télécharger le devis
        </button>
      </div>

      {/* ---------- Élément caché pour html2canvas ---------- */}
      {company && basket.length > 0 && (
        <div
          id="quote-to-download"
          style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
        >
          <QuoteProforma
            quoteRef={`DEVIS-${Date.now()}`}
            company={company}
            clientLabel={
              client
                ? client.username ?? client.email ?? client.phone ?? client._id
                : "—"
            }
            addressLabel={addressLabel}
            boutique={boutique}
            delivery={delivery}
            basket={basket}
            date={today}
          />
        </div>
      )}
    </div>
  );
};

export default OrderPreview;
