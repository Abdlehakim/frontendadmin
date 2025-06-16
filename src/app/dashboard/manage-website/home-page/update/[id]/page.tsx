// src/app/dashboard/manage-website/New-Products/update/[id]/page.tsx
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
import { PiImage } from "react-icons/pi";
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
  HPboutiqueTitle: string;
  HPboutiqueSubTitle: string;
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
    HPboutiqueTitle: "",
    HPboutiqueSubTitle: "",
    HPNewProductTitle: "",
    HPNewProductSubTitle: "",
    HPPromotionTitle: "",
    HPPromotionSubTitle: "",
    HPBestCollectionTitle: "",
    HPBestCollectionSubTitle: "",
  });
  const [existingBannerUrl, setExistingBannerUrl] = useState<string>("");
  const [HPbannerFile, setHPbannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { homePageData } = await fetchFromAPI<{
          homePageData: (FormFields & {
            _id: string;
            HPbannerImgUrl: string;
          })[];
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
          HPboutiqueTitle: entry.HPboutiqueTitle,
          HPboutiqueSubTitle: entry.HPboutiqueSubTitle,
          HPNewProductTitle: entry.HPNewProductTitle,
          HPNewProductSubTitle: entry.HPNewProductSubTitle,
          HPPromotionTitle: entry.HPPromotionTitle,
          HPPromotionSubTitle: entry.HPPromotionSubTitle,
          HPBestCollectionTitle: entry.HPBestCollectionTitle,
          HPBestCollectionSubTitle: entry.HPBestCollectionSubTitle,
        });
        setExistingBannerUrl(entry.HPbannerImgUrl);
      } catch (e) {
        console.error("Failed to load entry:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setHPbannerFile(file);
    if (!file && bannerInput.current) bannerInput.current.value = "";
  };

  const clearFile = () => {
    setHPbannerFile(null);
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
      Object.entries(form).forEach(([key, val]) => fd.append(key, val.trim()));
      if (HPbannerFile) fd.append("banner", HPbannerFile);

      await fetchFromAPI<{ message: string }>(
        `/dashboardadmin/homepage/updatehomePageData/${id}`,
        { method: "PUT", body: fd }
      );

      setShowSuccess(true);
      setTimeout(
        () => router.push("/dashboard/manage-website/home-page"),
        1200
      );
    } catch (err: unknown) {
      console.error("Update failed:", err);
      if (err instanceof Error) setError(err.message);
      else setError("Failed to update entry.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header & breadcrumb */}
      <div className="flex justify-start gap-2 flex-col  h-16">
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

      {/* Loading state with centered spinner */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Banner Upload */}
          <div className="relative border-2 border-gray-300 rounded-lg h-64 cursor-pointer hover:border-gray-400 transition">
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>

            {HPbannerFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={URL.createObjectURL(HPbannerFile)}
                  alt="Banner Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : existingBannerUrl ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={existingBannerUrl}
                  alt="Existing Banner"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-full text-gray-400"
                onClick={() => bannerInput.current?.click()}
              >
                <input
                  ref={bannerInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                Click to upload
                <br />
                Banner Image
              </div>
            )}
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

          {/* Boutique Title & Sub Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="HPboutiqueTitle" className="text-sm font-medium">
                Boutique Title*
              </label>
              <input
                id="HPboutiqueTitle"
                name="HPboutiqueTitle"
                type="text"
                value={form.HPboutiqueTitle}
                onChange={handleInputChange}
                required
                className="border-2 border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="HPboutiqueSubTitle"
                className="text-sm font-medium"
              >
                Boutique Sub Title*
              </label>
              <input
                id="HPboutiqueSubTitle"
                name="HPboutiqueSubTitle"
                type="text"
                value={form.HPboutiqueSubTitle}
                onChange={handleInputChange}
                required
                className="border-2 border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* New Product Title & Sub Title */}
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
                New Product Sub Title*
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

          {/* Promotion Title & Sub Title */}
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
                Promotion Sub Title*
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

          {/* Best Collection Title & Sub Title */}
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
                Best Collection Sub Title*
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
                className="px-6 py-2 bg-quaternary text-white rounded"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-tertiary text-white rounded"
            >
              {submitting ? "Updating..." : "Update Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Overlay & Error */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Updated successfully!" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
