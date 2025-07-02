// src/app/dashboard/manage-website/product-page/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSpinner } from "react-icons/fa6";

interface ProductPageData {
  _id: string;
  SPTitle: string;
  SPSubTitle: string;
}

export default function ProductPageAdminPage() {
  const [item, setItem] = useState<ProductPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { productPageData } =
          await fetchFromAPI<{ productPageData: ProductPageData[] }>(
            "/dashboardadmin/website/productpage/getProductPageData"
          );
        setItem(productPageData[0] ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Product Page</h1>
        {item ? (
          <Link href={`/dashboard/manage-website/product-page/update/${item._id}`}> 
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Update
            </button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/product-page/create">
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Create
            </button>
          </Link>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      )}

      {/* Details */}
      {!loading && (
        <>
          {/* SP Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Section Title</label>
            <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
              {item?.SPTitle ?? ""}
            </div>
          </div>

          {/* SP Sub Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Section Sub Title</label>
            <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
              {item?.SPSubTitle ?? ""}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
