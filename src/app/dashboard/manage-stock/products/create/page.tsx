// ───────────────────────────────────────────────────────────────
// src/app/dashboard/manage-stock/products/create/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Stepper from "@/components/Stepper";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

import ProductBreadcrumb from "@/components/addproductsteps/ProductBreadcrumb";
import WizardNav from "@/components/addproductsteps/WizardNav";

import StepDetails from "@/components/addproductsteps/StepDetails";
import StepData from "@/components/addproductsteps/StepData";
import StepAttributesDetails from "@/components/addproductsteps/StepAttributesDetails";
import StepReview from "@/components/addproductsteps/StepReview";

import type {
  AttributePayload,
  AttributeDef,
  ProductDetailPair,
} from "@/components/addproductsteps/StepAttributesDetails";

import {
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
  StockStatus,
  StatusPage,
  Vadmin,
} from "@/constants/product-options";

export interface AttributeRow {
  name: string;
  value?: string;
  hex?: string;
  image?: string;
  imageId?: string;
}

function cleanAttributeValue(
  value: string | AttributeRow[] | undefined
): string | AttributeRow[] {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .filter((r) => r.name.trim())
      .map((r) => {
        const row: AttributeRow = { name: r.name.trim() };
        if (r.value?.trim()) row.value = r.value.trim();
        if (r.hex?.trim()) {
          row.hex = r.hex.trim();
          if (!row.value) row.value = row.hex;
        }
        if (r.image?.trim()) row.image = r.image.trim();
        if (r.imageId?.trim()) row.imageId = r.imageId.trim();
        return row;
      });
  }
  return "";
}

export interface ProductForm {
  name: string;
  info: string;
  description: string;
  categorie: string;
  subcategorie: string;
  magasin: string;
  brand: string;
  stock: string;
  price: string;
  tva: string;
  discount: string;
  stockStatus: StockStatus;
  statuspage: StatusPage;
  vadmin: Vadmin;
}

const blankForm: ProductForm = {
  name: "",
  info: "",
  description: "",
  categorie: "",
  subcategorie: "",
  magasin: "",
  brand: "",
  stock: "0",
  price: "0",
  tva: "0",
  discount: "0",
  stockStatus: "in stock",
  statuspage: "none",
  vadmin: "not-approve",
};

export default function CreateProductPage() {
  const router = useRouter();

  const mainRef  = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  const [step, setStep]       = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [form, setForm]         = useState<ProductForm>(blankForm);
  const [mainImage, setMainImage]     = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [defs,           setDefs]            = useState<AttributeDef[]>([]);
  const [attrPayload,    setAttrPayload]     = useState<AttributePayload[]>([]);
  const [detailsPayload, setDetailsPayload] = useState<ProductDetailPair[]>([]);
  const [fileMap,        setFileMap]         = useState<Map<string, File>>(new Map());

  useEffect(() => {
    fetchFromAPI<{ productAttributes: AttributeDef[] }>(
      "/dashboardadmin/stock/productattribute"
    )
      .then(({ productAttributes }) => setDefs(productAttributes))
      .catch((e) => console.error(e));
  }, []);

  const handleAttrsAndDetails = useCallback(
    (
      attrs: AttributePayload[],
      dets: ProductDetailPair[],
      fmap: Map<string, File>
    ) => {
      setAttrPayload(attrs);
      setDetailsPayload(dets);
      setFileMap(new Map(fmap));
    },
    []
  );

  const removeExtra = (idx: number) =>
    setExtraImages((prev) => prev.filter((_, i) => i !== idx));

  const onFixed = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const next = () => {
    setError(null);
    if (step === 3) {
      const invalid = attrPayload.some((a) =>
        Array.isArray(a.value)
          ? a.value.some((r) => !r.name.trim())
          : false
      );
      if (invalid) {
        setError("Each attribute row needs a name.");
        return;
      }
    }
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mainImage) {
      setError("Main image required");
      setStep(1);
      return;
    }
    setSaving(true);

    try {
      const fd = new FormData();

      // scalar fields
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v);
      });

      // root images
      fd.append("mainImage", mainImage);
      extraImages.forEach((f) => fd.append("extraImages", f));

      // attributes
      type AttrEither =
        | { definition: string; value: AttributeRow[] }
        | { definition: string; value: string };
      const serverAttrs = attrPayload
        .map<AttrEither | null>(({ attributeSelected, value }) => {
          const cleaned = cleanAttributeValue(value);
          if (typeof cleaned === "string" && cleaned.trim()) {
            return { definition: attributeSelected, value: cleaned };
          }
          if (Array.isArray(cleaned) && cleaned.length > 0) {
            return { definition: attributeSelected, value: cleaned };
          }
          return null;
        })
        .filter((x): x is AttrEither => x !== null);
      fd.append("attributes", JSON.stringify(serverAttrs));

      // details
      const serverDetails = detailsPayload
        .filter((d) => d.name.trim())
        .map(({ name, description }) => ({
          name: name.trim(),
          description: description?.trim(),
        }));
      fd.append("productDetails", JSON.stringify(serverDetails));

      // dynamic image uploads
      const attrEntries = [...fileMap.entries()].filter(([k]) =>
        k.startsWith("attributeImages-")
      );
      const detailEntries = [...fileMap.entries()]
        .filter(([k]) => k.startsWith("detailsImages-"))
        .sort((a, b) => {
          const ia = +a[0].split("-")[1]!;
          const ib = +b[0].split("-")[1]!;
          return ia - ib;
        });

      attrEntries.forEach(([key, file]) => {
        fd.append("attributeImages", file, key);
      });
      detailEntries.forEach(([key, file]) => {
        fd.append("detailsImages", file, key);
      });

      await fetchFromAPI("/dashboardadmin/stock/products/create", {
        method: "POST",
        body: fd,
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/products"), 3000);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : String(err) || "Failed to create product";
      setError(message);
      setSaving(false);
    }
  };

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 h-full">
      <ProductBreadcrumb
        baseHref="/dashboard/manage-stock/products"
        baseLabel="All Products"
        currentLabel="Create Product"
      />

      <Stepper
        steps={["Details", "Data", "Attributes", "Review"]}
        currentStep={step}
        onStepClick={(s) => setStep(s as 1 | 2 | 3 | 4)}
      />

      <form onSubmit={handleSubmit} className="flex flex-col h-full gap-8">
        {step === 1 && (
          <StepDetails
            form={form}
            onFixed={onFixed}
            mainImage={mainImage}
            extraImages={extraImages}
            chooseMain={() => mainRef.current?.click()}
            chooseExtra={() => extraRef.current?.click()}
            clearMain={() => setMainImage(null)}
            removeExtra={removeExtra}
          />
        )}
        {step === 2 && (
          <StepData
            form={form}
            onFixed={onFixed}
            STOCK_OPTIONS={STOCK_OPTIONS}
            PAGE_OPTIONS={PAGE_OPTIONS}
            ADMIN_OPTIONS={ADMIN_OPTIONS}
          />
        )}
        {step === 3 && (
          <StepAttributesDetails
            defs={defs}
            initialAttrs={[]}
            initialDetails={[]}
            ready={true}
            onChange={handleAttrsAndDetails}
          />
        )}
        {step === 4 && (
          <StepReview
            form={form}
            mainImage={mainImage}
            attrPayload={attrPayload}
            detailsPayload={detailsPayload}
          />
        )}

        <WizardNav
          step={step}
          saving={saving}
          onBack={back}
          onNext={next}
          onCancel={() => router.push("/dashboard/manage-stock/products")}
        />

        <input
          ref={mainRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setMainImage(e.target.files?.[0] || null)}
        />
        <input
          ref={extraRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            setExtraImages((prev) => [...prev, ...files]);
          }}
        />
      </form>

      <Overlay
        show={saving || success}
        message={success ? "Product successfully created" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
