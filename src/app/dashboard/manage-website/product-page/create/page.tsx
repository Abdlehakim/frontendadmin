// src/app/dashboard/manage-website/product-page/create/page.tsx
"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface FormFields {
  SPTitle: string;
  SPSubTitle: string;
}

export default function CreateProductPageData() {
  const router = useRouter();
  const [form, setForm] = useState<FormFields>({ SPTitle: "", SPSubTitle: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if data exists
  useEffect(() => {
    (async () => {
      try {
        const { productPageData } = await fetchFromAPI<{ productPageData: { _id: string }[] }>(
          "/dashboardadmin/website/productpage/getProductPageData"
        );
        if (productPageData.length > 0) {
          router.replace(
            `/dashboard/manage-website/product-page/update/${productPageData[0]._id}`
          );
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!form.SPTitle.trim() || !form.SPSubTitle.trim()) {
      setError("All fields are required.");
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("SPTitle", form.SPTitle.trim());
      fd.append("SPSubTitle", form.SPSubTitle.trim());

      await fetchFromAPI<{ message: string }>(
        "/dashboardadmin/website/productpage/createProductPageData",
        { method: "POST", body: fd }
      );

      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-website/product-page"), 1500);
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
        <h1 className="text-3xl font-bold uppercase">Create Product Page</h1>
        <Link href="/dashboard/manage-website/product-page">
          <button className="px-4 py-2 bg-quaternary text-white rounded hover:opacity-90">
            All Entries
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* SP Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="SPTitle" className="text-sm font-medium">Section Title*</label>
          <input
            id="SPTitle"
            name="SPTitle"
            type="text"
            value={form.SPTitle}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* SP Sub Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="SPSubTitle" className="text-sm font-medium">Section Sub Title*</label>
          <input
            id="SPSubTitle"
            name="SPSubTitle"
            type="text"
            value={form.SPSubTitle}
            onChange={handleInputChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-website/product-page">
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
