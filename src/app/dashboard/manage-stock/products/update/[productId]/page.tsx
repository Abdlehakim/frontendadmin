// ───────────────────────────────────────────────────────────────
// src/app/dashboard/manage-stock/products/update/[productId]/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import ProductBreadcrumb from "@/components/addproductsteps/ProductBreadcrumb";
import WizardNav from "@/components/addproductsteps/WizardNav";
import Stepper from "@/components/Stepper";
import StepDetails from "@/components/addproductsteps/StepDetails";
import StepData from "@/components/addproductsteps/StepData";
import StepAttributesDetails, {
  AttributeDef,
  AttributePayload,
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
/* Extra types                                                        */
/* ------------------------------------------------------------------ */
export interface AttributeRow {
  name: string;
  value?: string;
  hex?: string;
  image?: string;
  imageId?: string;
}

type ServerAttr =
  | { definition: string; value: AttributeRow[] }
  | { definition: string; value: string }
  | null;

/* detail payload sent to the server ─ eslint-safe */
type ServerDetail = {
  name: string;
  description: string;
  image?: string | null;
};

/* ------------------------------------------------------------------ */
/* Local form types                                                   */
/* ------------------------------------------------------------------ */
interface ProductForm {
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

interface FetchedProduct {
  name: string;
  info: string;
  description: string;
  categorie: string;
  subcategorie?: string | null;
  boutique?: string | null;
  brand?: string | null;
  stock: number;
  price: number;
  tva: number;
  discount: number;
  stockStatus: StockStatus;
  statuspage: StatusPage;
  vadmin: Vadmin;
  attributes: AttributePayload[];
  productDetails: ProductDetailPair[];
  mainImageUrl?: string;
  extraImagesUrl?: string[];
}

/* ------------------------------------------------------------------ */
/* helper: keep rows that have at least a non-blank name              */
/* ------------------------------------------------------------------ */
function cleanAttributeValue(
  value: string | AttributeRow[] | undefined
): string | AttributeRow[] {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .filter((r) => r.name.trim())
      .map((r) => {
        const clean: AttributeRow = { name: r.name.trim() };
        if (r.value?.trim()) clean.value = r.value.trim();
        if (r.hex?.trim()) {
          clean.hex = r.hex.trim();
          if (!clean.value) clean.value = clean.hex;
        }
        if (r.image?.trim()) clean.image = r.image.trim();
        if (r.imageId?.trim()) clean.imageId = r.imageId.trim();
        return clean;
      });
  }
  return "";
}

/* ================================================================== */
export default function UpdateProductPage() {
  const router = useRouter();
  const { productId } = useParams();

  const mainRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [form, setForm] = useState<ProductForm>(blankForm);

  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string | null>(
    null
  );
  const [existingExtraImagesUrls, setExistingExtraImagesUrls] = useState<string[]>(
    []
  );

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [defs, setDefs] = useState<AttributeDef[]>([]);
  const [attrPayload, setAttrPayload] = useState<AttributePayload[]>([]);
  const [detailsPayload, setDetailsPayload] = useState<ProductDetailPair[]>([]);
  const [attributeFiles, setAttributeFiles] = useState<Map<string, File>>(
    new Map()
  );

  /* ------------------------------------------------------------------ */
  /* Fetch attribute definitions                                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    fetchFromAPI<{ productAttributes: AttributeDef[] }>(
      "/dashboardadmin/stock/productattribute"
    )
      .then(({ productAttributes }) => setDefs(productAttributes))
      .catch((err) => console.error("Failed to load attribute defs:", err));
  }, []);

  /* ------------------------------------------------------------------ */
  /* Fetch product data                                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFromAPI<FetchedProduct>(
          `/dashboardadmin/stock/products/${productId}`
        );

        setForm({
          name: data.name,
          info: data.info,
          description: data.description,
          categorie: data.categorie,
          subcategorie: data.subcategorie ?? "",
          boutique: data.boutique ?? "",
          brand: data.brand ?? "",
          stock: String(data.stock),
          price: String(data.price),
          tva: String(data.tva),
          discount: String(data.discount),
          stockStatus: data.stockStatus,
          statuspage: data.statuspage,
          vadmin: data.vadmin,
        });
        setAttrPayload(data.attributes || []);
        setDetailsPayload(data.productDetails || []);
        setExistingMainImageUrl(data.mainImageUrl ?? null);
        setExistingExtraImagesUrls(data.extraImagesUrl || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product.");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                           */
  /* ------------------------------------------------------------------ */
  const onFixed = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

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

  /* ----------------------------- */
  /* Main image                    */
  /* ----------------------------- */
  const handleMainChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMainImage(file);
    if (file) setExistingMainImageUrl(null);
  };

  const clearMain = () => {
    setMainImage(null);
    setExistingMainImageUrl(null);
    if (mainRef.current) mainRef.current.value = "";
  };

  /* ----------------------------- */
  /* Extra images (add / remove)   */
  /* ----------------------------- */

  /**
   * Updates the FileList on the <input type="file" multiple> element.
   * Browsers treat FileList as read-only, so we rebuild via DataTransfer.
   */
  const syncExtraInput = (files: File[]) => {
    if (!extraRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    extraRef.current.files = dt.files;
  };

  const handleExtraChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setExtraImages((prev) => {
      const updated = [...prev, ...files];
      syncExtraInput(updated);
      return updated;
    });
  };

  const removeExtra = (idx: number) => {
    // Removing an existing URL (already on server)
    if (idx < existingExtraImagesUrls.length) {
      setExistingExtraImagesUrls((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    // Removing a not-yet-uploaded File
    const fileIdx = idx - existingExtraImagesUrls.length;
    setExtraImages((prev) => {
      const newArr = prev.filter((_, i) => i !== fileIdx);
      syncExtraInput(newArr);
      return newArr;
    });
  };

  /* ------------------------------------------------------------------ */
  /* Stepper navigation                                                 */
  /* ------------------------------------------------------------------ */
  const next = () => {
    setError(null);
    if (step === 3) {
      const invalid = attrPayload.some((a) =>
        Array.isArray(a.value) ? a.value.some((row) => !row.name?.trim()) : false
      );
      if (invalid) {
        setError("Each attribute row needs a name (other fields are optional).");
        return;
      }
    }
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };

  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  /* ------------------------------------------------------------------ */
  /* Submit                                                             */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();

      // scalar fields
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      // images: main & extra
      if (mainImage) fd.append("mainImage", mainImage);
      else if (existingMainImageUrl === null) fd.append("removeMain", "1");

      extraImages.forEach((f) => fd.append("extraImages", f));
      fd.append("remainingExtraUrls", JSON.stringify(existingExtraImagesUrls));

      // attributes
      const serverAttrs = attrPayload
        .map<ServerAttr>(({ attributeSelected, value }) => {
          const cleaned = cleanAttributeValue(value);
          if (typeof cleaned === "string" && cleaned.trim())
            return { definition: attributeSelected, value: cleaned };
          if (Array.isArray(cleaned) && cleaned.length > 0)
            return {
              definition: attributeSelected,
              value: cleaned,
            };
          return null;
        })
        .filter((entry): entry is Exclude<ServerAttr, null> => entry !== null);
      fd.append("attributes", JSON.stringify(serverAttrs));

      // productDetails (typed — no "any")
      const serverDetails: ServerDetail[] = detailsPayload
        .filter((d) => d.name.trim())
        .map(({ name, description, image }) => {
          const detail: ServerDetail = {
            name: name.trim(),
            description: description?.trim() ?? "",
          };
          if (image !== undefined) detail.image = image; // string | null
          return detail;
        });
      fd.append("productDetails", JSON.stringify(serverDetails));

      // attribute & details images
      for (const [key, file] of attributeFiles.entries()) {
        if (key.startsWith("attributeImages-"))
          fd.append("attributeImages", file, key);
        if (key.startsWith("detailsImages-"))
          fd.append("detailsImages", file, key);
      }

      await fetchFromAPI(
        `/dashboardadmin/stock/products/update/${productId}`,
        { method: "PUT", body: fd }
      );

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/products"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product.");
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  if (loading) return <Overlay show spinnerSize={60} />;

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <ProductBreadcrumb
        baseHref="/dashboard/manage-stock/products"
        baseLabel="All Products"
        currentLabel="Update Product"
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
            clearMain={clearMain}
            removeExtra={removeExtra}
            existingMainImageUrl={existingMainImageUrl}
            existingExtraImagesUrls={existingExtraImagesUrls}
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
            initialAttrs={attrPayload}
            initialDetails={detailsPayload}
            ready={!loading}
            onChange={handleAttrsAndDetails}
          />
        )}

        {step === 4 && (
          <StepReview
            form={form}
            mainImage={mainImage}
            existingMainImageUrl={existingMainImageUrl}
            extraImages={extraImages}
            existingExtraImagesUrls={existingExtraImagesUrls}
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
          submitLabel="Update Product"
          submittingLabel="Updating..."
        />

        {/* hidden file inputs */}
        <input
          ref={mainRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleMainChange}
        />
        <input
          ref={extraRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleExtraChange}
        />
      </form>

      <Overlay
        show={saving || success}
        message={success ? "Product updated successfully" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
