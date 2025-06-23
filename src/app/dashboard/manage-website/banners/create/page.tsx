// src/app/dashboard/manage-website/banners/create/page.tsx

"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdArrowForwardIos } from "react-icons/md";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

/* ----------------------------- types ----------------------------- */
interface FormFields {
  BCbannerTitle: string;
  PromotionBannerTitle: string;
  NPBannerTitle: string;
  BlogBannerTitle: string;
}

/* --------------------------- component --------------------------- */
export default function CreateBannersPage() {
  const [form, setForm] = useState<FormFields>({
    BCbannerTitle: "",
    PromotionBannerTitle: "",
    NPBannerTitle: "",
    BlogBannerTitle: "",
  });

  const [BCbannerFile, setBCbannerFile] = useState<File | null>(null);
  const [PromotionBannerFile, setPromotionBannerFile] = useState<File | null>(null);
  const [NPBannerFile, setNPBannerFile] = useState<File | null>(null);
  const [BlogBannerFile, setBlogBannerFile] = useState<File | null>(null);

  const [BCpreview, setBCpreview] = useState<string | null>(null);
  const [PromoPreview, setPromoPreview] = useState<string | null>(null);
  const [NPPreview, setNPPreview] = useState<string | null>(null);
  const [BlogPreview, setBlogPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ------------------------ handlers ------------------------ */
  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0] ?? null;
    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (BCbannerFile) data.append("BCbanner", BCbannerFile);
      if (PromotionBannerFile) data.append("PromotionBanner", PromotionBannerFile);
      if (NPBannerFile) data.append("NPBanner", NPBannerFile);
      if (BlogBannerFile) data.append("BlogBanner", BlogBannerFile);

      const res = await fetchFromAPI<{ success: boolean; message?: string }>(
        "/dashboardadmin/website/banners/createBanners",
        { method: "POST", body: data }
      );

      if (res.success) {
        window.location.href = "/dashboard/manage-website/banners";
      } else {
        setErrorMsg(res.message || "Failed to create banners.");
      }
    } catch (err) {
      console.error("Create Banners Error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* header + breadcrumb */}
      <div className="flex flex-col gap-2 h-16">
        <h1 className="text-3xl font-bold">Create Banners</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link href="/dashboard/manage-website/banners" className="text-gray-500 hover:underline">
            Banners
          </Link>
          <MdArrowForwardIos size={14} className="text-gray-400" />
          <span className="text-gray-700 font-medium">Create Entry</span>
        </nav>
      </div>

      {/* loading state */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-6">
          {/* banner upload grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Best-Collection */}
            <div className="flex flex-col gap-2">
              <div className="relative h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
                {BCpreview ? (
                  <Image src={BCpreview} alt="BC Preview" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Best-Collection banner selected
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setBCbannerFile, setBCpreview)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
              </div>
              <label htmlFor="BCbannerTitle" className="text-sm font-medium">
                Best-Collection Title
              </label>
              <input
                id="BCbannerTitle"
                type="text"
                value={form.BCbannerTitle}
                onChange={handleTextChange}
                placeholder="e.g. Discover Our Finest"
                required
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>

            {/* Promotion */}
            <div className="flex flex-col gap-2">
              <div className="relative h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
                {PromoPreview ? (
                  <Image src={PromoPreview} alt="Promotion Preview" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Promotion banner selected
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setPromotionBannerFile, setPromoPreview)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
              </div>
              <label htmlFor="PromotionBannerTitle" className="text-sm font-medium">
                Promotion Title
              </label>
              <input
                id="PromotionBannerTitle"
                type="text"
                value={form.PromotionBannerTitle}
                onChange={handleTextChange}
                placeholder="e.g. Big Deals This Week"
                required
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>

            {/* New-Products */}
            <div className="flex flex-col gap-2">
              <div className="relative h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
                {NPPreview ? (
                  <Image src={NPPreview} alt="NP Preview" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No New-Products banner selected
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setNPBannerFile, setNPPreview)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
              </div>
              <label htmlFor="NPBannerTitle" className="text-sm font-medium">
                New-Products Title
              </label>
              <input
                id="NPBannerTitle"
                type="text"
                value={form.NPBannerTitle}
                onChange={handleTextChange}
                placeholder="e.g. Just Arrived"
                required
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>

            {/* Blog */}
            <div className="flex flex-col gap-2">
              <div className="relative h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
                {BlogPreview ? (
                  <Image src={BlogPreview} alt="Blog Preview" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Blog banner selected
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setBlogBannerFile, setBlogPreview)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
              </div>
              <label htmlFor="BlogBannerTitle" className="text-sm font-medium">
                Blog Title
              </label>
              <input
                id="BlogBannerTitle"
                type="text"
                value={form.BlogBannerTitle}
                onChange={handleTextChange}
                placeholder="e.g. Latest Insights"
                required
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
          </div>

          {/* buttons */}
          <div className="flex justify-center gap-8">
            <Link href="/dashboard/manage-website/banners">
              <button
                type="button"
                disabled={loading}
                className="px-6 py-2 bg-quaternary text-white rounded disabled:opacity-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-tertiary text-white rounded disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Banners"}
            </button>
          </div>
        </form>
      )}

      {/* overlay + error popup */}
      <Overlay show={loading} />
      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}
