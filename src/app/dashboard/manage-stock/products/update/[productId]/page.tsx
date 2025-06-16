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

/* ───────── local types ───────── */
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
  subcategorie: string;
  boutique: string;
  brand: string;
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

  // existing image URLs
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<
    string | null
  >(null);
  const [existingExtraImagesUrls, setExistingExtraImagesUrls] = useState<
    string[]
  >([]);

  // newly selected files
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  // attribute definitions
  const [defs, setDefs] = useState<AttributeDef[]>([]);

  // attributes & details payloads
  const [attrPayload, setAttrPayload] = useState<AttributePayload[]>([]);
  const [detailsPayload, setDetailsPayload] = useState<ProductDetailPair[]>([]);

  /* ───────── fetch attribute definitions ───────── */
  useEffect(() => {
    fetchFromAPI<{ productAttributes: AttributeDef[] }>(
      "/dashboardadmin/stock/productattribute",
    )
      .then(({ productAttributes }) => setDefs(productAttributes))
      .catch((err) => console.error("Failed to load attribute defs:", err));
  }, []);

  /* ───────── fetch product data on mount ───────── */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFromAPI<FetchedProduct>(
          `/dashboardadmin/stock/products/${productId}`,
        );

        // populate form
        setForm({
          name: data.name,
          info: data.info,
          description: data.description,
          categorie: data.categorie,
          subcategorie: data.subcategorie,
          boutique: data.boutique,
          brand: data.brand,
          stock: String(data.stock),
          price: String(data.price),
          tva: String(data.tva),
          discount: String(data.discount),
          stockStatus: data.stockStatus,
          statuspage: data.statuspage,
          vadmin: data.vadmin,
        });

        // attrs & details
        setAttrPayload(data.attributes || []);
        setDetailsPayload(data.productDetails || []);

        // images
        setExistingMainImageUrl(data.mainImageUrl ?? null);
        setExistingExtraImagesUrls(data.extraImagesUrl ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load product.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  /* ───────── generic form handler ───────── */
  const onFixed = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ───────── sync attrs & details ───────── */
  const handleAttrsAndDetails = useCallback(
    (attrs: AttributePayload[], details: ProductDetailPair[]) => {
      setAttrPayload(attrs);
      setDetailsPayload(details);
    },
    [],
  );

  /* ───────── image handlers ───────── */
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

  const handleExtraChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setExtraImages((prev) => [...prev, ...files]);
  };
  const removeExtra = (idx: number) => {
    if (idx < existingExtraImagesUrls.length) {
      setExistingExtraImagesUrls((prev) => prev.filter((_, i) => i !== idx));
    } else {
      const newIdx = idx - existingExtraImagesUrls.length;
      setExtraImages((prev) => prev.filter((_, i) => i !== newIdx));
    }
  };

  /* ───────── navigation ───────── */
  const next = () => {
    setError(null);
    if (step === 3) {
      const invalid = attrPayload.some((a) => {
        if (typeof a.value === "string") return !a.value.trim();
        return Array.isArray(a.value)
          ? a.value.some((pair) => {
              const emptyName = !pair.name?.trim();
              if ("value" in pair)
                return emptyName || !String(pair.value).trim();
              if ("hex" in pair) return emptyName || !String(pair.hex).trim();
              return true;
            })
          : true;
      });
      if (invalid) {
        setError("Please complete all attribute entries before proceeding.");
        return;
      }
    }
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  /* ───────── submit ───────── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (mainImage) {
        fd.append("mainImage", mainImage);
      } else if (existingMainImageUrl === null) {
        fd.append("removeMain", "1");
      }

      extraImages.forEach((f) => fd.append("extraImages", f));
      fd.append("remainingExtraUrls", JSON.stringify(existingExtraImagesUrls));

      const serverAttrs = attrPayload.map(({ attributeSelected, value }) => ({
        definition: attributeSelected,
        value,
      }));
      fd.append("attributes", JSON.stringify(serverAttrs));
      fd.append("productDetails", JSON.stringify(detailsPayload));

      await fetchFromAPI(`/dashboardadmin/stock/products/update/${productId}`, {
        method: "PUT",
        body: fd,
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/products"), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update product.",
      );
      setSaving(false);
    }
  };

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
