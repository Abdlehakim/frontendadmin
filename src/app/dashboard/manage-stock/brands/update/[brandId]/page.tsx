/// brands/update/[brandId]/page.tsx


"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

export default function UpdateBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = String(params.brandId);
  const logoInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialLogoUrl, setInitialLogoUrl] = useState<string>("");
  const [initialImageUrl, setInitialImageUrl] = useState<string>("");

  const [form, setForm] = useState({ name: "", place: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const b = await fetchFromAPI<{
          name: string;
          place: string;
          logoUrl?: string;
          imageUrl?: string;
        }>(`/dashboardadmin/stock/brands/${brandId}`);

        setForm({ name: b.name, place: b.place });
        if (b.logoUrl)  setInitialLogoUrl(b.logoUrl);
        if (b.imageUrl) setInitialImageUrl(b.imageUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load brand.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [brandId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLogoFile(e.target.files?.[0] ?? null);
  };
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] ?? null);
  };
  const clearLogo = () => {
    setLogoFile(null);
    setInitialLogoUrl("");
    if (logoInput.current) logoInput.current.value = "";
  };
  const clearImage = () => {
    setImageFile(null);
    setInitialImageUrl("");
    if (imageInput.current) imageInput.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("place", form.place.trim());
      if (logoFile)  fd.append("logo", logoFile);
      if (imageFile) fd.append("image", imageFile);

      await fetchFromAPI<{ message: string }>(
        `/dashboardadmin/stock/brands/update/${brandId}`,
        { method: "PUT", body: fd }
      );

      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-stock/brands"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update brand.");
      setSubmitting(false);
    }
  };

  if (loading) return <Overlay show spinnerSize={60} />;

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Update Brand</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-stock/brands"
            className="text-gray-500 hover:underline"
          >
            All Brands
          </Link>
          <MdArrowForwardIos className="text-gray-400" />
          <span className="text-gray-700 font-medium">Update Brand</span>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Name & Place */}
        <div className="grid grid-cols-3 gap-6">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name*</span>
            <input
              name="name"
              value={form.name}
              onChange={handleInputChange}
              required
              className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Place*</span>
            <input
              name="place"
              value={form.place}
              onChange={handleInputChange}
              required
              className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
            />
          </label>
        </div>

        {/* Logo Upload */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Logo</span>
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => logoInput.current?.click()}
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded"
          >
            Choose Logo
          </button>
          {(logoFile || initialLogoUrl) && (
            <div className="flex items-center gap-2">
              <span className="truncate max-w-xs">
                {logoFile
                  ? logoFile.name
                  : initialLogoUrl.split("/").pop()}
              </span>
              <button
                type="button"
                onClick={clearLogo}
                className="text-red-600 hover:text-red-800"
              >
                <MdDelete size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Image</span>
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInput.current?.click()}
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded"
          >
            Choose Image
          </button>
          {(imageFile || initialImageUrl) && (
            <div className="flex items-center gap-2">
              <span className="truncate max-w-xs">
                {imageFile
                  ? imageFile.name
                  : initialImageUrl.split("/").pop()}
              </span>
              <button
                type="button"
                onClick={clearImage}
                className="text-red-600 hover:text-red-800"
              >
                <MdDelete size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-stock/brands">
            <button
              type="button"
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
            {submitting ? <FaSpinner className="animate-spin" /> : "Update Brand"}
          </button>
        </div>
      </form>

      {/* Overlays */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Brand updated successfully" : undefined}
      />

      {/* Error */}
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}