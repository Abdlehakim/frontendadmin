// src/components/addproductsteps/StepData.tsx
"use client";

import React, { ChangeEvent, useState, useEffect } from "react";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

// Types for fetched lists
interface Category { _id: string; name: string; }
interface SubCategory { _id: string; name: string; }
interface Boutique { _id: string; name: string; }
interface Brand { _id: string; name: string; }

// Simple data fields vs. status selects
const DATA_FIELDS = [
  "categorie",
  "subcategorie",
  "boutique",
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
}

export default function StepData({
  form,
  onFixed,
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
}: Props) {
  // State: always arrays (never undefined)
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Fetch lists on mount, ensuring fallbacks
  useEffect(() => {
    (async () => {
      try {
        const catsRes = await fetchFromAPI<{ categories?: Category[] }>(
          "/dashboardadmin/stock/categories"
        );
        setCategories(catsRes.categories ?? []);

        const subsRes = await fetchFromAPI<{ subCategories?: SubCategory[] }>(
          "/dashboardadmin/stock/subcategories"
        );
        setSubcategories(subsRes.subCategories ?? []);

        const boutsRes = await fetchFromAPI<{ boutiques?: Boutique[] }>(
          "/dashboardadmin/stock/boutiques"
        );
        setBoutiques(boutsRes.boutiques ?? []);

        const brandsRes = await fetchFromAPI<{ brands?: Brand[] }>(
          "/dashboardadmin/stock/brands"
        );
        setBrands(brandsRes.brands ?? []);
      } catch (err) {
        console.error("Failed to load option lists:", err);
      }
    })();
  }, []);

  return (
    <section className="grid gap-6 grid-cols-3">
      {DATA_FIELDS.map((field: DataField) => {
        if (field === "categorie") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-sm font-medium capitalize">Category</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Select category</option>
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
              <span className="text-sm font-medium capitalize">Sub-Category</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Select sub-category</option>
                {subcategories.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        if (field === "boutique") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-sm font-medium capitalize">Boutique</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Select boutique</option>
                {boutiques.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        if (field === "brand") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-sm font-medium capitalize">Brand</span>
              <select
                name={field}
                value={form[field] ?? ""}
                onChange={onFixed}
                className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              >
                <option value="">Select brand</option>
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
            <span className="text-sm font-medium capitalize">{field}</span>
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
            ? { opts: STOCK_OPTIONS, label: "Stock Status" }
            : key === "statuspage"
            ? { opts: PAGE_OPTIONS, label: "Page Status" }
            : { opts: ADMIN_OPTIONS, label: "Admin Status" };

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
