/* ------------------------------------------------------------------
   Sélection et panier des produits pour la création de commande
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSearch, FaSpinner } from "react-icons/fa";
import type { Client } from "./selectClient";

/* ---------- constants ---------- */
const MIN_CHARS = 2;
const DEBOUNCE  = 300;

/* ---------- types ---------- */
interface AttributeRow {
  attributeSelected: { _id: string; name: string };
  value?:
    | string
    | Array<{ name: string; value?: string; hex?: string; image?: string }>;
}

/** subset returned by /stock/products/find */
interface ProductLite {
  _id: string;
  name: string;
  reference: string;
  price: number;
  tva: number;
  discount: number;
  stockStatus: "in stock" | "out of stock";
  attributes?: AttributeRow[];
}

/** item stored in basket with qty & chosen attrs */
export interface BasketItem extends ProductLite {
  quantity: number;
  chosen: Record<string, string>;
}

interface SelectProductsProps {
  client: Client | null;
  basket: BasketItem[];
  setBasket: React.Dispatch<React.SetStateAction<BasketItem[]>>;
}

/* ---------- helpers ---------- */
const unitPrice = (p: ProductLite) =>
  p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;

/* ---------- component ---------- */
export default function SelectProducts({
  client,
  basket,
  setBasket,
}: SelectProductsProps) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<ProductLite[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const boxRef                  = useRef<HTMLDivElement>(null);

  /* ───────── product autocomplete effect ───────── */
  useEffect(() => {
    if (!client) return;
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      setError("");
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { products } = await fetchFromAPI<{ products: ProductLite[] }>(
          `/dashboardadmin/stock/products/find?q=${encodeURIComponent(
            query.trim()
          )}`
        );
        setResults(products);
        if (products.length === 0) setError("Aucun résultat.");
      } catch {
        setError("Erreur de recherche.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);
    return () => clearTimeout(id);
  }, [query, client]);

  /* ───────── close dropdown on outside click ───────── */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setResults([]);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ───────── basket helpers ───────── */
  const decrement = (index: number) =>
    setBasket((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it
      )
    );

  const increment = (index: number) =>
    setBasket((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, quantity: it.quantity + 1 } : it
      )
    );

  const addProduct = (p: ProductLite) => {
    if (basket.some((b) => b._id === p._id)) return; // avoid duplicates
    const chosen: Record<string, string> = {};
    p.attributes?.forEach((row) => {
      const id  = row.attributeSelected._id;
      const val = row.value;
      if (!id) return;
      if (typeof val === "string") chosen[id] = val;
      else if (Array.isArray(val) && val.length) chosen[id] = val[0].name;
    });
    setBasket((b) => [...b, { ...p, quantity: 1, chosen }]);
    setQuery("");
    setResults([]);
  };

  const removeProduct = (id: string) =>
    setBasket((b) => b.filter((it) => it._id !== id));

  /* ---------- attribute selector ---------- */
  const renderAttrSelector = (
    itemIdx: number,
    attrRow: NonNullable<ProductLite["attributes"]>[number]
  ) => {
    const id            = attrRow.attributeSelected._id;
    const attributeName = attrRow.attributeSelected.name;
    const value         = attrRow.value;
    const opts: string[] = [];
    if (typeof value === "string") opts.push(value);
    else if (Array.isArray(value)) opts.push(...value.map((o) => o.name));

    if (opts.length === 0) return null;

    return (
      <div key={id} className="flex items-center gap-1">
        <span className="text-sm">{attributeName}:</span>
        <select
          className="border rounded px-1 text-sm"
          value={basket[itemIdx].chosen[id]}
          onChange={(e) => {
            const val = e.target.value;
            setBasket((prev) =>
              prev.map((it, i) =>
                i === itemIdx ? { ...it, chosen: { ...it.chosen, [id]: val } } : it
              )
            );
          }}
        >
          {opts.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  };

  /* ───────── UI ───────── */
  return (
    <>
      {/* ---------- Product picker ---------- */}
      {client && (
        <div ref={boxRef} className="relative">
          <label className="font-semibold">Ajouter un produit :</label>
          <div className="flex gap-2 mt-1">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError("");
              }}
              placeholder="Nom ou référence…"
              className="flex-1 border border-gray-300 rounded px-4 py-2"
            />
            <div className="bg-primary text-white px-4 py-2 rounded flex items-center">
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
            </div>
          </div>
          {query && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
              {results.map((p) => (
                <li
                  key={p._id}
                  onClick={() => addProduct(p)}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-100 flex justify-between"
                >
                  <span>
                    {p.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({p.reference})
                    </span>
                  </span>
                  <span
                    className={`text-xs ${
                      p.stockStatus === "in stock"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {p.stockStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {error && !loading && (
            <p className="text-red-600 mt-1 text-sm">{error}</p>
          )}
        </div>
      )}

      {/* ---------- Basket preview ---------- */}
      {basket.length > 0 && (
        <div className="border rounded-lg p-4 bg-white space-y-4 mt-6">
          <h2 className="font-bold">Produits sélectionnés</h2>

          {basket.map((item, idx) => (
            <div key={item._id} className="border rounded p-3 bg-gray-50 space-y-3">
              {/* header row */}
              <div className="flex justify-between items-center">
                <div className="font-medium">
                  {item.name}{" "}
                  <span className="text-xs text-gray-500">
                    ({item.reference})
                  </span>
                </div>
                <button
                  onClick={() => removeProduct(item._id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Retirer
                </button>
              </div>

              {/* quantity & pricing */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Qté :</span>

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => decrement(idx)}
                      className="py-1 px-3 hover:bg-primary hover:text-white disabled:opacity-40"
                      disabled={item.quantity === 1}
                      aria-label="Diminuer la quantité"
                    >
                      –
                    </button>

                    <div className="w-12 border-l border-r border-gray-300 min-w-[40px] text-center">
                      {item.quantity}
                    </div>

                    <button
                      onClick={() => increment(idx)}
                      className="py-1 px-3 hover:bg-primary hover:text-white"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-sm">
                  Prix TTC : <strong>{unitPrice(item).toFixed(2)}</strong>
                  {item.discount > 0 && (
                    <span className="ml-2 line-through text-xs text-gray-500">
                      {item.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="text-sm">
                  TVA : <strong>{item.tva}%</strong>
                </div>
              </div>

              {/* attributes */}
              {item.attributes && item.attributes.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {item.attributes.map((row) => renderAttrSelector(idx, row))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
