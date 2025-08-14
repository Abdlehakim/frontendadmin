// src/app/dashboard/manage-website/home-page/update/[id]/page.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { FaSpinner } from "react-icons/fa6";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Image from "next/image";

interface FormFields {
  HPbannerTitle: string;
  HPcategorieTitle: string;
  HPcategorieSubTitle: string;
  HPbrandTitle: string;
  HPbrandSubTitle: string;
  HPmagasinTitle: string;
  HPmagasinSubTitle: string;
  HPNewProductTitle: string;
  HPNewProductSubTitle: string;
  HPPromotionTitle: string;
  HPPromotionSubTitle: string;
  HPBestCollectionTitle: string;
  HPBestCollectionSubTitle: string;
}

export default function UpdateHomePageData() {
  const { id } = useParams();
  const router = useRouter();
  const bannerInput = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormFields>({
    HPbannerTitle: "",
    HPcategorieTitle: "",
    HPcategorieSubTitle: "",
    HPbrandTitle: "",
    HPbrandSubTitle: "",
    HPmagasinTitle: "",
    HPmagasinSubTitle: "",
    HPNewProductTitle: "",
    HPNewProductSubTitle: "",
    HPPromotionTitle: "",
    HPPromotionSubTitle: "",
    HPBestCollectionTitle: "",
    HPBestCollectionSubTitle: "",
  });
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | undefined>();
  const [bannerPreview, setBannerPreview] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { homePageData } = await fetchFromAPI<{
          homePageData: (FormFields & { _id: string; HPbannerImgUrl: string })[];
        }>("/api/dashboardadmin/website/homepage/gethomePageData");

        if (homePageData.length === 0) {
          router.replace("/dashboard/manage-website/home-page/create");
          return;
        }

        const entry = homePageData.find((e) => e._id === id);
        if (!entry) {
          router.replace("/dashboard/manage-website/home-page");
          return;
        }

        setForm({
          HPbannerTitle: entry.HPbannerTitle,
          HPcategorieTitle: entry.HPcategorieTitle,
          HPcategorieSubTitle: entry.HPcategorieSubTitle,
          HPbrandTitle: entry.HPbrandTitle,
          HPbrandSubTitle: entry.HPbrandSubTitle,
          HPmagasinTitle: entry.HPmagasinTitle,
          HPmagasinSubTitle: entry.HPmagasinSubTitle,
          HPNewProductTitle: entry.HPNewProductTitle,
          HPNewProductSubTitle: entry.HPNewProductSubTitle,
          HPPromotionTitle: entry.HPPromotionTitle,
          HPPromotionSubTitle: entry.HPPromotionSubTitle,
          HPBestCollectionTitle: entry.HPBestCollectionTitle,
          HPBestCollectionSubTitle: entry.HPBestCollectionSubTitle,
        });
        setExistingBannerUrl(entry.HPbannerImgUrl);
        setBannerPreview(entry.HPbannerImgUrl);
      } catch (e) {
        console.error("Failed to load entry:", e);
        setError("Failed to load existing home page data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
    } else {
      setBannerPreview(existingBannerUrl);
    }
    if (!file && bannerInput.current) bannerInput.current.value = "";
  };

  const clearBanner = () => {
    setBannerPreview(undefined);
    if (bannerInput.current) bannerInput.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    for (const [key, val] of Object.entries(form)) {
      if (!val.trim()) {
        setError(`Field "${key}" is required.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) =>
        fd.append(key, val.trim())
      );
      const file = bannerInput.current?.files?.[0];
      if (file) fd.append("banner", file);

      await fetchFromAPI<{ success: boolean; message: string }>(
        `/api/dashboardadmin/website/homepage/updatehomePageData/${id}`,
        { method: "PUT", body: fd }
      );

      setShowSuccess(true);
      setTimeout(
        () => router.push("/dashboard/manage-website/home-page"),
        1200
      );
    } catch (err: unknown) {
      console.error("Update failed:", err);
      setError(err instanceof Error ? err.message : "Failed to update entry.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <FaSpinner className="animate-spin text-3xl text-gray-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header & breadcrumb */}
      <div className="flex justify-start gap-2 flex-col h-16">
        <h1 className="text-3xl font-bold">Update Home Page</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-website/home-page"
            className="text-gray-500 hover:underline"
          >
            Home Page
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Update Entry</span>
        </nav>
      </div>

      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Banner Upload */}
        <div className="relative border-2 border-gray-300 rounded-lg h-40 overflow-hidden">
          {bannerPreview ? (
            <>
              <Image
                src={bannerPreview}
                alt="Banner Preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={clearBanner}
                className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
              >
                <MdDelete size={16} className="text-red-600" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Click or drag & drop to upload Banner
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={bannerInput}
            onChange={handleBannerChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {/* Banner Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="HPbannerTitle" className="text-sm font-medium">
            Banner Title*
          </label>
          <input
            id="HPbannerTitle"
            name="HPbannerTitle"
            type="text"
            value={form.HPbannerTitle}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Categorie Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="HPcategorieTitle"
              className="text-sm font-medium"
            >
              Categorie Title*
            </label>
            <input
              id="HPcategorieTitle"
              name="HPcategorieTitle"
              type="text"
              value={form.HPcategorieTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="HPcategorieSubTitle"
              className="text-sm font-medium"
            >
              Categorie Subtitle*
            </label>
            <input
              id="HPcategorieSubTitle"
              name="HPcategorieSubTitle"
              type="text"
              value={form.HPcategorieSubTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Brand Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPbrandTitle" className="text-sm font-medium">
              Brand Title*
            </label>
            <input
              id="HPbrandTitle"
              name="HPbrandTitle"
              type="text"
              value={form.HPbrandTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="HPbrandSubTitle" className="text-sm font-medium">
              Brand Subtitle*
            </label>
            <input
              id="HPbrandSubTitle"
              name="HPbrandSubTitle"
              type="text"
              value={form.HPbrandSubTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Magasin Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPmagasinTitle" className="text-sm font-medium">
              Magasin Title*
            </label>
            <input
              id="HPmagasinTitle"
              name="HPmagasinTitle"
              type="text"
              value={form.HPmagasinTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="HPmagasinSubTitle" className="text-sm font-medium">
              Magasin Subtitle*
            </label>
            <input
              id="HPmagasinSubTitle"
              name="HPmagasinSubTitle"
              type="text"
              value={form.HPmagasinSubTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* New Product Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="HPNewProductTitle"
              className="text-sm font-medium"
            >
              New Product Title*
            </label>
            <input
              id="HPNewProductTitle"
              name="HPNewProductTitle"
              type="text"
              value={form.HPNewProductTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="HPNewProductSubTitle"
              className="text-sm font-medium"
            >
              New Product Subtitle*
            </label>
            <input
              id="HPNewProductSubTitle"
              name="HPNewProductSubTitle"
              type="text"
              value={form.HPNewProductSubTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Promotion Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPPromotionTitle" className="text-sm font-medium">
              Promotion Title*
            </label>
            <input
              id="HPPromotionTitle"
              name="HPPromotionTitle"
              type="text"
              value={form.HPPromotionTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="HPPromotionSubTitle"
              className="text-sm font-medium"
            >
              Promotion Subtitle*
            </label>
            <input
              id="HPPromotionSubTitle"
              name="HPPromotionSubTitle"
              type="text"
              value={form.HPPromotionSubTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Best Collection Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="HPBestCollectionTitle"
              className="text-sm font-medium"
            >
              Best Collection Title*
            </label>
            <input
              id="HPBestCollectionTitle"
              name="HPBestCollectionTitle"
              type="text"
              value={form.HPBestCollectionTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="HPBestCollectionSubTitle"
              className="text-sm font-medium"
            >
              Best Collection Subtitle*
            </label>
            <input
              id="HPBestCollectionSubTitle"
              name="HPBestCollectionSubTitle"
              type="text"
              value={form.HPBestCollectionSubTitle}
              onChange={handleInputChange}
              required
              className="border-2 border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-website/home-page">
            <button
              type="button"
              disabled={submitting}
              className="px-6 py-2 bg-quaternary text-white rounded disabled:opacity-50"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <FaSpinner className="animate-spin" />}
            {submitting ? "Updating..." : "Update Entry"}
          </button>
        </div>
      </form>

      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Updated successfully!" : undefined}
      />
    </div>
  );
}
