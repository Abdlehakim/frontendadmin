// src/app/dashboard/manage-website/home-page/create/page.tsx
"use client";

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdDelete } from "react-icons/md";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Image from "next/image";
import { PiImage } from "react-icons/pi";

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

export default function CreateHomePageData() {
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
  const [HPbannerFile, setHPbannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if data already exists
  useEffect(() => {
    (async () => {
      try {
        const { homePageData } = await fetchFromAPI<{ homePageData: { _id: string }[] }>(
          "/dashboardadmin/homepage/gethomePageData"
        );
        if (homePageData.length > 0) {
          router.replace(`/dashboard/manage-website/home-page/update/${homePageData[0]._id}`);
          return;
        }
      } catch (e) {
        console.error("Error checking existing data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return <div className="py-6 text-center">Checking existing data…</div>;
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
        "/dashboardadmin/homepage/createhomePageData",
        { method: "POST", body: fd }
      );

      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-website/home-page"), 1500);
    } catch (err: unknown) {
      console.error("Creation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create entry.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Create Home Page</h1>
        <Link href="/dashboard/manage-website/home-page">
          <button className="px-4 py-2 bg-quaternary text-white rounded hover:opacity-90">
            All Entries
          </button>
        </Link>
      </div>

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
                unoptimized
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
          <label htmlFor="HPbannerTitle" className="text-sm font-medium">Banner Title*</label>
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

        {/* Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPcategorieTitle" className="text-sm font-medium">Category Title*</label>
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
            <label htmlFor="HPcategorieSubTitle" className="text-sm font-medium">Category Sub Title*</label>
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

        {/* Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPbrandTitle" className="text-sm font-medium">Brand Title*</label>
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
            <label htmlFor="HPbrandSubTitle" className="text-sm font-medium">Brand Sub Title*</label>
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

        {/* Boutique */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPboutiqueTitle" className="text-sm font-medium">Boutique Title*</label>
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
            <label htmlFor="HPboutiqueSubTitle" className="text-sm font-medium">Boutique Sub Title*</label>
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

        {/* New Product */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPNewProductTitle" className="text-sm font-medium">New Product Title*</label>
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
            <label htmlFor="HPNewProductSubTitle" className="text-sm font-medium">New Product Sub Title*</label>
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

        {/* Promotion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPPromotionTitle" className="text-sm font-medium">Promotion Title*</label>
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
            <label htmlFor="HPPromotionSubTitle" className="text-sm font-medium">Promotion Sub Title*</label>
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

        {/* Best Collection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="HPBestCollectionTitle" className="text-sm font-medium">Best Collection Title*</label>
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
            <label htmlFor="HPBestCollectionSubTitle" className="text-sm font-medium">Best Collection Sub Title*</label>
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
            {submitting ? "Creating..." : "Create Entry"}
          </button>
        </div>
      </form>

      {/* Overlay & Error */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Created successfully!" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
