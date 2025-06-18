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
import StepAttributesDetails, {
  AttributePayload,
  AttributeDef,
  ProductDetailPair,
} from "@/components/addproductsteps/StepAttributesDetails";
import StepReview from "@/components/addproductsteps/StepReview";

import {
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
  StockStatus,
  StatusPage,
  Vadmin,
} from "@/constants/product-options";

/* ------------------------------------------------------------------ */
/* Helpers & types                                                    */
/* ------------------------------------------------------------------ */
export interface AttributeRow {
  name: string;
  value?: string;
  hex?: string;
  image?: string;
  imageId?: string;
}

/** Keep any row that has a non-blank name (other fields optional). */
function cleanAttributeValue(
  value: string | AttributeRow[] | undefined
): string | AttributeRow[] {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    const rows = value
      .filter((r) => r.name && r.name.trim())
      .map((r) => {
        const row: AttributeRow = { name: r.name.trim() };

        if (r.value && r.value.trim()) row.value = r.value.trim();
        if (r.hex && r.hex.trim()) {
          row.hex = r.hex.trim();
          if (!row.value) row.value = row.hex;
        }
        if (r.image && r.image.trim()) row.image = r.image.trim();
        if (r.imageId && r.imageId.trim()) row.imageId = r.imageId.trim();

        return row;
      });

    return rows;
  }

  return "";
}

/* ------------------------------------------------------------------ */
/* Product form                                                       */
/* ------------------------------------------------------------------ */
export interface ProductForm {
  name: string;
  info: string;
  description: string;
  categorie: string;
  subcategorie: string;
  boutique: string;
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
  boutique: "",
  brand: "",
  stock: "0",
  price: "0",
  tva: "0",
  discount: "0",
  stockStatus: "in stock",
  statuspage: "none",
  vadmin: "not-approve",
};

/* ================================================================== */
export default function CreateProductPage() {
  const router = useRouter();

  /* hidden file inputs */
  const mainRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  /* wizard state */
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* form state */
  const [form, setForm] = useState<ProductForm>(blankForm);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  /* attributes & details */
  const [defs, setDefs] = useState<AttributeDef[]>([]);
  const [attrPayload, setAttrPayload] = useState<AttributePayload[]>([]);
  const [detailsPayload, setDetailsPayload] = useState<ProductDetailPair[]>([]);
  const [attributeFiles, setAttributeFiles] = useState<Map<string, File>>(new Map());

  /* ---------- load attribute definitions ---------- */
  useEffect(() => {
    fetchFromAPI<{ productAttributes: AttributeDef[] }>(
      "/dashboardadmin/stock/productattribute"
    )
      .then(({ productAttributes }) => setDefs(productAttributes))
      .catch((e) => console.error("Failed to load product attributes:", e));
  }, []);

  /* ---------- child → parent callback ---------- */
  const handleAttrsAndDetails = useCallback(
    (
      attrs: AttributePayload[],
      details: ProductDetailPair[],
      fileMap: Map<string, File>
    ) => {
      setAttrPayload(attrs);
      setDetailsPayload(details);
      setAttributeFiles(fileMap);
    },
    []
  );

  /* ---------- misc handlers ---------- */
  const removeExtra = (idx: number) =>
    setExtraImages((prev) => prev.filter((_, i) => i !== idx));

  const onFixed = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  /* ---------- wizard navigation ---------- */
  const next = () => {
    setError(null);

    if (step === 3) {
      const invalid = attrPayload.some((a) =>
        Array.isArray(a.value)
          ? a.value.some((row) => !row.name?.trim())
          : false
      );

      if (invalid) {
        setError("Each attribute row needs a name (other fields are optional).");
        return;
      }
    }

    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };

  const back = () =>
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  /* ---------- submit ---------- */
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

      /* scalar fields */
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      /* images */
      fd.append("mainImage", mainImage);
      extraImages.forEach((f) => fd.append("extraImages", f));

      /* attributes */
      type AttrEither =
        | { definition: string; value: AttributeRow[] }
        | { definition: string; value: string }
        | null;

      const serverAttrs = attrPayload
        .map<AttrEither>(({ attributeSelected, value }) => {
          const cleaned = cleanAttributeValue(value);
          return cleaned && Array.isArray(cleaned) && cleaned.length > 0
            ? { definition: attributeSelected, value: cleaned }
            : typeof cleaned === "string" && cleaned.trim()
            ? { definition: attributeSelected, value: cleaned }
            : null;
        })
        .filter(
          (entry): entry is Exclude<AttrEither, null> => entry !== null
        );

      fd.append("attributes", JSON.stringify(serverAttrs));
      fd.append("productDetails", JSON.stringify(detailsPayload));

      /* swatch images */
      attributeFiles.forEach((file, key) => {
        const wrapped = new File([file], key, { type: file.type });
        fd.append("attributeImages", wrapped, key);
      });

      await fetchFromAPI("/dashboardadmin/stock/products/create", {
        method: "POST",
        body: fd,
      });

      setSuccess(true);
      setTimeout(
        () => router.push("/dashboard/manage-stock/products"),
        3000
      );
    } catch (err: unknown) {
      setSaving(false);
      setError(
        err instanceof Error ? err.message : "Failed to create product"
      );
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
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

      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-between gap-8 h-full"
      >
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

        {/* hidden inputs */}
        <input
          ref={mainRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => setMainImage(e.target.files?.[0] || null)}
        />
        <input
          ref={extraRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
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
