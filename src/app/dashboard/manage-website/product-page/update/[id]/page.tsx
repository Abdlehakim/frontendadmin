// src/app/dashboard/manage-website/product-page/update/[id]/page.tsx
"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface FormFields {
  SPTitle: string;
  SPSubTitle: string;
}
interface ProductPageData {
  _id: string;
  SPTitle: string;
  SPSubTitle: string;
}

export default function UpdateProductPageDataPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState<FormFields>({ SPTitle: "", SPSubTitle: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing data
  useEffect(() => {
    (async () => {
      try {
        const { productPageData } = await fetchFromAPI<{ productPageData: ProductPageData[] }>(
          "/dashboardadmin/website/productpage/getProductPageData"
        );
        const existing = productPageData.find((p) => p._id === id);
        if (!existing) {
          setError("Entrée introuvable.");
          return;
        }
        setForm({
          SPTitle: existing.SPTitle,
          SPSubTitle: existing.SPSubTitle,
        });
      } catch (e) {
        console.error(e);
        setError("Échec du chargement des données.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="py-6 text-center">Chargement…</div>;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!form.SPTitle.trim() || !form.SPSubTitle.trim()) {
      setError("Tous les champs sont requis.");
      setSubmitting(false);
      return;
    }

    try {
      await fetchFromAPI<{ message: string }>(
        `/dashboardadmin/website/productpage/updateProductPageData/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            SPTitle: form.SPTitle.trim(),
            SPSubTitle: form.SPSubTitle.trim(),
          }),
        }
      );
      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/manage-website/product-page"), 1500);
    } catch (err) {
      console.error("Update failed:", err);
      setError(err instanceof Error ? err.message : "Échec de la mise à jour.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Update Product Page</h1>
        <Link href="/dashboard/manage-website/product-page">
          <button className="px-4 py-2 bg-quaternary text-white rounded hover:opacity-90">
            Voir toutes
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* SP Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="SPTitle" className="text-sm font-medium">
            Section Title*
          </label>
          <input
            id="SPTitle"
            name="SPTitle"
            type="text"
            value={form.SPTitle}
            onChange={handleChange}
            required
            className="border-2 border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* SP Sub Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="SPSubTitle" className="text-sm font-medium">
            Section Sub Title*
          </label>
          <input
            id="SPSubTitle"
            name="SPSubTitle"
            type="text"
            value={form.SPSubTitle}
            onChange={handleChange}
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
              Annuler
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded"
          >
            {submitting ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </div>
      </form>

      {/* Overlay & Error */}
      <Overlay show={submitting || showSuccess} message={showSuccess ? "Mise à jour réussie !" : undefined} />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
