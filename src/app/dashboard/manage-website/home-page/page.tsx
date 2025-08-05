// src/app/dashboard/manage-website/home-page/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSpinner } from "react-icons/fa6";

interface HomePageData {
  _id: string;
  HPbannerImgUrl: string;
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

export default function HomePageAdminPage() {
  const [item, setItem] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { homePageData } =
          await fetchFromAPI<{ homePageData: HomePageData[] }>(
            "/dashboardadmin/website/homepage/gethomePageData"
          );
        setItem(homePageData[0] ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header with conditional button */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Home Page</h1>
        {item ? (
          <Link href={`/dashboard/manage-website/home-page/update/${item._id}`}>
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Update
            </button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/home-page/create">
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Create
            </button>
          </Link>
        )}
      </div>

      {/* Loading spinner centered */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      )}

      {/* Details (show even if item is null, fields blank) */}
      {!loading && (
        <>
          {/* Banner preview */}
          <div className="relative h-64 mb-4 rounded-lg overflow-hidden border-2 border-gray-300">
            {item?.HPbannerImgUrl ? (
              <Image
                src={item.HPbannerImgUrl}
                alt="Banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No banner uploaded
              </div>
            )}
          </div>

          {/* Banner Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Banner Title</label>
            <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50 align-middle">
              {item?.HPbannerTitle ?? ""}
            </div>
          </div>

          {/* Category Title & Sub Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Category Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPcategorieTitle ?? ""}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Category Sub Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPcategorieSubTitle ?? ""}
              </div>
            </div>
          </div>

          {/* Brand Title & Sub Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Brand Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPbrandTitle ?? ""}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Brand Sub Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPbrandSubTitle ?? ""}
              </div>
            </div>
          </div>

          {/* Magasin Title & Sub Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Magasin Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPboutiqueTitle ?? ""}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Magasin Sub Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPboutiqueSubTitle ?? ""}
              </div>
            </div>
          </div>

          {/* New Product Title & Sub Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">New Product Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPNewProductTitle ?? ""}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">New Product Sub Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPNewProductSubTitle ?? ""}
              </div>
            </div>
          </div>

          {/* Promotion Title & Sub Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Promotion Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPPromotionTitle ?? ""}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Promotion Sub Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPPromotionSubTitle ?? ""}
              </div>
            </div>
          </div>

          {/* Best Collection Title & Sub Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Best Collection Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPBestCollectionTitle ?? ""}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Best Collection Sub Title</label>
              <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
                {item?.HPBestCollectionSubTitle ?? ""}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
