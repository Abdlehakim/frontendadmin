// src/app/dashboard/manage-website/banners/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface BannersData {
  _id: string;
  /* Best-Collection */
  BCbannerImgUrl?: string;
  BCbannerTitle: string;
  /* Promotion */
  PromotionBannerImgUrl?: string;
  PromotionBannerTitle: string;
  /* New-Products */
  NPBannerImgUrl?: string;
  NPBannerTitle: string;
  /* Blog */
  BlogBannerImgUrl?: string;
  BlogBannerTitle: string;
}

export default function BannersAdminPage() {
  const [item, setItem] = useState<BannersData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { banners } = await fetchFromAPI<{ banners: BannersData }>(
          "/dashboardadmin/website/banners/getBanners"
        );
        setItem(banners ?? null);
      } catch (err: unknown) {
        if (err instanceof Error && /not\s+found/i.test(err.message)) {
          setItem(null);
        } else {
          console.error("Fetch Banners Error:", err);
          setError("Failed to load banners.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Special Page Banners</h1>
        {item ? (
          <Link href={`/dashboard/manage-website/banners/update/${item._id}`}>
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Update
            </button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/banners/create">
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Create
            </button>
          </Link>
        )}
      </div>

      {/* Loading | Error | Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <div className="flex flex-col gap-6 py-6">
          {/* Banner Images */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Best-Collection */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-1/4 overflow-hidden">
              {item?.BCbannerImgUrl ? (
                <Image
                  src={item.BCbannerImgUrl}
                  alt="Best Collection Banner"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No BC banner uploaded
                </div>
              )}
            </div>

            {/* Promotion */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-1/4 overflow-hidden">
              {item?.PromotionBannerImgUrl ? (
                <Image
                  src={item.PromotionBannerImgUrl}
                  alt="Promotion Banner"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Promotion banner uploaded
                </div>
              )}
            </div>

            {/* New-Products */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-1/4 overflow-hidden">
              {item?.NPBannerImgUrl ? (
                <Image
                  src={item.NPBannerImgUrl}
                  alt="New Products Banner"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No NP banner uploaded
                </div>
              )}
            </div>

            {/* Blog */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-1/4 overflow-hidden">
              {item?.BlogBannerImgUrl ? (
                <Image
                  src={item.BlogBannerImgUrl}
                  alt="Blog Banner"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Blog banner uploaded
                </div>
              )}
            </div>
          </div>

          {/* Banner Titles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-8">
            <div className="flex flex-col gap-2">
              <label htmlFor="bcTitle" className="text-sm font-medium">
                Best-Collection Title
              </label>
              <input
                id="bcTitle"
                type="text"
                value={item?.BCbannerTitle ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="promoTitle" className="text-sm font-medium">
                Promotion Title
              </label>
              <input
                id="promoTitle"
                type="text"
                value={item?.PromotionBannerTitle ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="npTitle" className="text-sm font-medium">
                New-Products Title
              </label>
              <input
                id="npTitle"
                type="text"
                value={item?.NPBannerTitle ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="blogTitle" className="text-sm font-medium">
                Blog Title
              </label>
              <input
                id="blogTitle"
                type="text"
                value={item?.BlogBannerTitle ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
