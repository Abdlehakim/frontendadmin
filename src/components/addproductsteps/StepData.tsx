// ───────────────────────────────────────────────────────────────
// src/components/addproductsteps/StepData.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { ChangeEvent } from "react";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";

/* Types for lists passed from the page */
export interface Category { _id: string; name: string; }
export interface SubCategory { _id: string; name: string; }
export interface Magasin { _id: string; name: string; }
export interface Brand { _id: string; name: string; }

/* Fields */
const DATA_FIELDS = [
  "categorie",
  "subcategorie",
  "magasin",
  "brand",
  "stock",
  "price",
  "tva",
  "discount",
] as const;
type DataField = typeof DATA_FIELDS[number];

const SELECT_KEYS = ["stockStatus", "statuspage", "vadmin"] as const;
type SelectField = typeof SELECT_KEYS[number];

interface Props {
  form: ProductForm;
  onFixed: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  STOCK_OPTIONS: readonly ProductForm["stockStatus"][];
  PAGE_OPTIONS: readonly ProductForm["statuspage"][];
  ADMIN_OPTIONS: readonly ProductForm["vadmin"][];
  /* NEW: lists (provided by page) */
  categories: Category[];
  subcategories: SubCategory[];
  magasins: Magasin[];
  brands: Brand[];
}

export default function StepData({
  form,
  onFixed,
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
  categories,
  subcategories,
  magasins,
  brands,
}: Props) {
  return (
    <section className="grid gap-6 grid-cols-3">
      {DATA_FIELDS.map((field: DataField) => {
        if (field === "categorie") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-sm font-medium">Catégorie</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        if (field === "subcategorie") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-sm font-medium">Sous-catégorie</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Sélectionnez une sous-catégorie</option>
                {subcategories.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        if (field === "magasin") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-sm font-medium">Magasin</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Sélectionnez un magasin</option>
                {magasins.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        if (field === "brand") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-sm font-medium">Marque</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Sélectionnez une marque</option>
                {brands.map((br) => (
                  <option key={br._id} value={br._id}>
                    {br.name}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        return (
          <label key={field} className="flex flex-col gap-1">
            <span className="text-sm font-medium capitalize">
              {field === "price" ? "Prix" :
               field === "stock" ? "Stock" :
               field === "tva" ? "TVA" :
               field === "discount" ? "Remise" : field}
            </span>
            <input
              name={field}
              value={form[field] as string}
              onChange={onFixed}
              onFocus={(e) => (e.target as HTMLInputElement).select()}
              className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
            />
          </label>
        );
      })}

      {SELECT_KEYS.map((key: SelectField) => {
        const { opts, label } =
          key === "stockStatus"
            ? { opts: STOCK_OPTIONS, label: "État du stock" }
            : key === "statuspage"
            ? { opts: PAGE_OPTIONS, label: "Statut de la page" }
            : { opts: ADMIN_OPTIONS, label: "Statut administrateur" };

        return (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{label}</span>
            <select
              name={key}
              value={form[key] ?? ""}
              onChange={onFixed}
              className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
            >
              {opts.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </section>
  );
}
