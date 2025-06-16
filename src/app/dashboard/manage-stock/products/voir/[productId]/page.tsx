// src/app/dashboard/manage-stock/products/voir/[productId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

export const STOCK_OPTIONS = ["in stock", "out of stock"] as const;
export const PAGE_OPTIONS = [
  "none",
  "New-Products",
  "promotion",
  "best-collection",
] as const;
export const ADMIN_OPTIONS = ["not-approve", "approve"] as const;

export type StockStatus = (typeof STOCK_OPTIONS)[number];
export type StatusPage = (typeof PAGE_OPTIONS)[number];
export type Vadmin = (typeof ADMIN_OPTIONS)[number];

type AttrValueItem =
  | { name: string; value: string }
  | { name: string; hex: string };

interface FetchedAttribute {
  attributeSelected: string;
  attributeName: string;
  value: string | AttrValueItem[];
}

interface FetchedProduct {
  _id: string;
  name: string;
  info: string;
  description: string;
  categorie: { _id: string; name: string } | string;
  subcategorie: { _id: string; name: string } | string;
  boutique: { _id: string; name: string } | string;
  brand: { _id: string; name: string } | string;
  stock: number;
  price: number;
  tva: number;
  discount: number;
  stockStatus: StockStatus;
  statuspage: StatusPage;
  vadmin: Vadmin;
  attributes: FetchedAttribute[];
  productDetails: { name: string; description?: string }[];
  mainImageUrl?: string;
  extraImagesUrl?: string[];
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
}

export default function ProductViewPage() {
  const { productId } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<FetchedProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchFromAPI<FetchedProduct>(`/dashboardadmin/stock/products/${productId}`)
      .then((data) => {
        setProduct(data);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load product")
      )
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-quaternary text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return <p className="p-4">Product not found.</p>;
  }

  // Safely coalesce to an array
  const extraUrls = product.extraImagesUrl ?? [];

  const isAttrArray = (
    val: string | AttrValueItem[]
  ): val is AttrValueItem[] => Array.isArray(val);

  return (
    <div className="p-6 w-[80%] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-quaternary text-white rounded"
        >
          Back to list
        </button>
        <h1 className="text-3xl font-bold">Product Details</h1>
      </div>

      {/* Core Info */}
      <div className="bg-white shadow rounded p-6 grid grid-cols-2 gap-6">
        <div>
          <strong>Name:</strong> {product.name}
        </div>
        <div>
          <strong>Info:</strong> {product.info}
        </div>
        <div className="col-span-2">
          <strong>Description:</strong> {product.description}
        </div>
        <div>
          <strong>Category:</strong>{" "}
          {typeof product.categorie === "string"
            ? product.categorie
            : product.categorie.name}
        </div>
        <div>
          <strong>Subcategory:</strong>{" "}
          {typeof product.subcategorie === "string"
            ? product.subcategorie
            : product.subcategorie.name}
        </div>
        <div>
          <strong>Boutique:</strong>{" "}
          {typeof product.boutique === "string"
            ? product.boutique
            : product.boutique.name}
        </div>
        <div>
          <strong>Brand:</strong>{" "}
          {typeof product.brand === "string"
            ? product.brand
            : product.brand.name}
        </div>
        <div>
          <strong>Stock:</strong> {product.stock}
        </div>
        <div>
          <strong>Price:</strong> ${product.price.toFixed(2)}
        </div>
        <div>
          <strong>TVA:</strong> {product.tva}%
        </div>
        <div>
          <strong>Discount:</strong> {product.discount}%
        </div>
        <div>
          <strong>Stock Status:</strong> {product.stockStatus}
        </div>
        <div>
          <strong>Page Status:</strong> {product.statuspage}
        </div>
        <div>
          <strong>Admin Status:</strong>{" "}
          <span
            className={
              product.vadmin === "approve" ? "text-green-600" : "text-red-600"
            }
          >
            {product.vadmin}
          </span>
        </div>
        <div>
          <strong>Created By:</strong> {product.createdBy?.username ?? "—"}
        </div>
        <div>
          <strong>Created At:</strong>{" "}
          {new Date(product.createdAt).toLocaleString()}
        </div>
        <div>
          <strong>Updated By:</strong> {product.updatedBy?.username ?? "—"}
        </div>
        <div>
          <strong>Updated At:</strong>{" "}
          {new Date(product.updatedAt).toLocaleString()}
        </div>
      </div>

 {/* Main Image */}
      {product.mainImageUrl && (
        <div className="bg-white shadow rounded p-6">
          <strong>Main Image</strong>
          <div className="mt-2">
            <Image
              src={product.mainImageUrl}
              alt={`${product.name} main`}
              width={300}
              height={300}
              className="object-cover rounded"
            />
          </div>
        </div>
      )}

      {/* Extra Images */}
      {extraUrls.length > 0 && (
        <div className="bg-white shadow rounded p-6">
          <strong>Extra Images</strong>
          <div className="mt-2 flex flex-wrap gap-4">
            {extraUrls.map((url, idx) => (
              <Image
                key={idx}
                src={url}
                alt={`${product.name} extra ${idx + 1}`}
                width={200}
                height={200}
                className="object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {product.attributes.length > 0 && (
        <div className="bg-white shadow rounded p-6">
          <strong>Attributes</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {product.attributes.map((a, idx) => (
              <li key={idx}>
                <strong>{a.attributeName}:</strong>{" "}
                {isAttrArray(a.value)
                  ? a.value
                      .map((item) =>
                        "hex" in item
                          ? `${item.name} (${item.hex})`
                          : `${item.name}: ${item.value}`
                      )
                      .join(", ")
                  : a.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Product Details Pairs */}
      {product.productDetails.length > 0 && (
        <div className="bg-white shadow rounded p-6">
          <strong>Product Details</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {product.productDetails.map((d, idx) => (
              <li key={idx}>
                <strong>{d.name}:</strong> {d.description ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}