// ───────────────────────────────────────────────────────────────
// src/components/addproductsteps/StepReview.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";
import type {
  AttributePayload,
  ProductDetailPair,
} from "@/components/addproductsteps/StepAttributesDetails";
import type { DimPair } from "@/components/productattribute/Dimension";
import type { ColorPair } from "@/components/productattribute/Color";
import type { OtherPair } from "@/components/productattribute/OtherType";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface Props {
  form: ProductForm;
  mainImage: File | null;
  extraImages?: File[];
  existingMainImageUrl?: string | null;
  existingExtraImagesUrls?: string[];
  attrPayload: AttributePayload[];
  detailsPayload: ProductDetailPair[];
}

type AttrRow = DimPair | ColorPair | OtherPair;

type IdName = { _id: string; name: string };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function isColorPair(x: unknown): x is ColorPair {
  return isObject(x) && typeof (x as { name?: unknown }).name === "string" && typeof (x as { hex?: unknown }).hex === "string";
}
function hasValuePair(x: unknown): x is { name: string; value: string } {
  return isObject(x) && typeof (x as { name?: unknown }).name === "string" && typeof (x as { value?: unknown }).value === "string";
}
function hasImage(x: unknown): x is { image: string } {
  return isObject(x) && typeof (x as { image?: unknown }).image === "string";
}

export default function StepReview({
  form,
  mainImage,
  extraImages = [],
  existingMainImageUrl,
  existingExtraImagesUrls = [],
  attrPayload,
  detailsPayload,
}: Props) {
  const filePreview = (file: File) => URL.createObjectURL(file);

  // --- Lookup maps (ID -> name) for pretty display
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [subMap, setSubMap] = useState<Record<string, string>>({});
  const [shopMap, setShopMap] = useState<Record<string, string>>({});
  const [brandMap, setBrandMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const cats = await fetchFromAPI<{ categories?: IdName[] }>("/dashboardadmin/stock/categories");
        const subs = await fetchFromAPI<{ subCategories?: IdName[] }>("/dashboardadmin/stock/subcategories");
        const mags = await fetchFromAPI<{ magasins?: IdName[] }>("/dashboardadmin/stock/magasins");
        const brds = await fetchFromAPI<{ brands?: IdName[] }>("/dashboardadmin/stock/brands");

        const toMap = (arr: IdName[] | undefined) =>
          (arr ?? []).reduce<Record<string, string>>((acc, cur) => {
            acc[cur._id] = cur.name;
            return acc;
          }, {});

        setCatMap(toMap(cats.categories));
        setSubMap(toMap(subs.subCategories));
        setShopMap(toMap(mags.magasins));
        setBrandMap(toMap(brds.brands));
      } catch {
        // silent: if lookups fail we just fall back to IDs
      }
    })();
  }, []);

  const fieldLabels: Partial<Record<keyof ProductForm, string>> = useMemo(
    () => ({
      name: "Nom",
      info: "Infos",
      description: "Description",
      categorie: "Catégorie",
      subcategorie: "Sous-catégorie",
      magasin: "Magasin",
      brand: "Marque",
      stock: "Stock",
      price: "Prix",
      tva: "TVA",
      discount: "Remise",
      stockStatus: "État du stock",
      statuspage: "Statut de la page",
      vadmin: "Validation admin",
    }),
    []
  );

  const primaryOrder: (keyof ProductForm)[] = [
    "name",
    "info",
    "description",
    "categorie",
    "subcategorie",
    "magasin",
    "brand",
    "stock",
    "price",
    "tva",
    "discount",
  ];

  const statusKeys: (keyof ProductForm)[] = ["stockStatus", "statuspage", "vadmin"];

  const mapIdToName = (k: keyof ProductForm, v: unknown): string => {
    if (typeof v !== "string" || v.trim() === "") return "—";
    switch (k) {
      case "categorie":
        return catMap[v] ?? v;
      case "subcategorie":
        return subMap[v] ?? v;
      case "magasin":
        return shopMap[v] ?? v;
      case "brand":
        return brandMap[v] ?? v;
      default:
        return v;
    }
  };

  const formatValue = (k: keyof ProductForm, v: unknown) => {
    if (v === null || v === undefined || v === "") return "—";
    if (k === "categorie" || k === "subcategorie" || k === "magasin" || k === "brand") {
      return mapIdToName(k, v);
    }
    return String(v);
  };

  const badge = (text: string, tone: "green" | "amber" | "slate") => {
    const tones =
      tone === "green"
        ? "bg-green-50 text-green-700 ring-green-600/20"
        : tone === "amber"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
        : "bg-slate-50 text-slate-700 ring-slate-600/20";
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tones}`}>
        {text}
      </span>
    );
  };

  const statusBadge = (k: keyof ProductForm, v: string | undefined) => {
    const val = v ?? "—";
    if (k === "stockStatus") return badge(val, val === "in stock" ? "green" : "amber");
    if (k === "vadmin") return badge(val, val === "approve" ? "green" : "amber");
    return badge(val, "slate");
  };

  const MainImage = () => (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-slate-700">Image principale</h4>
      <div className="w-[160px] h-[120px] border rounded overflow-hidden bg-slate-50 flex items-center justify-center">
        {mainImage ? (
          <Image src={filePreview(mainImage)} alt="Aperçu image principale" width={160} height={120} className="object-cover w-full h-full" />
        ) : existingMainImageUrl ? (
          <Image src={existingMainImageUrl} alt="Image principale existante" width={160} height={120} className="object-cover w-full h-full" />
        ) : (
          <span className="text-slate-400 text-xs">Aucune image</span>
        )}
      </div>
    </div>
  );

  const ExtraImages = () => {
    const any = extraImages.length + (existingExtraImagesUrls?.length ?? 0) > 0;
    if (!any) return null;
    return (
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium text-slate-700">Images supplémentaires</h4>
        <div className="grid grid-cols-5 gap-2">
          {extraImages.map((f, i) => (
            <div key={`new-${i}`} className="w-[72px] h-[72px] border rounded overflow-hidden bg-slate-50">
              <Image src={filePreview(f)} alt={`Image supplémentaire ${i + 1}`} width={72} height={72} className="object-cover w-full h-full" />
            </div>
          ))}
          {existingExtraImagesUrls?.map((url, i) => (
            <div key={`exist-${i}`} className="w-[72px] h-[72px] border rounded overflow-hidden bg-slate-50">
              <Image src={url} alt={`Image supplémentaire ${i + 1}`} width={72} height={72} className="object-cover w-full h-full" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold">Récapitulatif du produit</h2>
        <p className="text-sm text-slate-500">Vérifiez les informations avant la validation.</p>
      </header>

      {/* Infos + Images */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl p-5 bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
          <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3">
            {primaryOrder.map((k) => (
              <div key={k} className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {fieldLabels[k] ?? (k as string)}
                </dt>
                <dd className={"text-sm text-slate-800 " + (k === "description" ? "whitespace-pre-wrap" : "")}>
                  {formatValue(k, form[k])}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border rounded-xl p-5 bg-white shadow-sm space-y-5">
          <h3 className="text-lg font-semibold">Images</h3>
          <MainImage />
          <ExtraImages />
        </div>
      </div>

      {/* Statuts */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Statuts</h3>
        <div className="flex flex-wrap gap-3">
          {statusKeys.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{fieldLabels[k]} :</span>
              {statusBadge(k, String(form[k] ?? ""))}
            </div>
          ))}
        </div>
      </div>

      {/* Attributs */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Attributs</h3>
          <span className="text-xs text-slate-500">
            {attrPayload.length} attribut{attrPayload.length > 1 ? "s" : ""}
          </span>
        </div>

        {attrPayload.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun attribut sélectionné.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {attrPayload.map((p) => (
              <div key={p.attributeSelected} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{p.attributeName}</h4>

                {Array.isArray(p.value) ? (
                  <ul className="space-y-2">
                    {(p.value as AttrRow[]).map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-slate-800">
                          {item.name}
                          {hasValuePair(item) && item.value ? ` : ${item.value}` : ""}
                          {isColorPair(item) && item.hex ? ` : ${item.hex}` : ""}
                        </span>
                        {isColorPair(item) && item.hex && (
                          <span className="inline-block w-4 h-4 rounded border" style={{ background: item.hex }} aria-label="Couleur" />
                        )}
                        {hasImage(item) && item.image && (
                          <Image src={item.image} alt="Aperçu attribut" width={28} height={28} className="object-cover rounded border" />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-800">{p.value}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Détails produit */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Détails du produit</h3>
          <span className="text-xs text-slate-500">
            {detailsPayload.length} détail{detailsPayload.length > 1 ? "s" : ""}
          </span>
        </div>

        {detailsPayload.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun détail produit.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {detailsPayload.map((d, i) => (
              <div key={i} className="border rounded-lg p-4 flex gap-4">
                {d.image && (
                  <div className="w-28 h-28 shrink-0 rounded overflow-hidden border bg-slate-50">
                    <Image src={d.image} alt={d.name} width={112} height={112} className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{d.name}</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{d.description ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
