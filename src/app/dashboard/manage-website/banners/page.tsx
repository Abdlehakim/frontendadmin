// ------------------------------------------------------------------
// src/app/dashboard/manage-website/banners/page.tsx
// ------------------------------------------------------------------
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface BannersData {
  _id: string;
  /* Meilleure collection */
  BCbannerImgUrl?: string;
  BCbannerTitle: string;
  /* Promotions */
  PromotionBannerImgUrl?: string;
  PromotionBannerTitle: string;
  /* Nouveaux produits */
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
        console.error("Erreur de chargement des bannières :", err);
        setError("Échec du chargement des bannières.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const T = {
    text: (v?: string) => (v && v.trim().length > 0 ? v : "—"),
  };

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* En-tête (style unifié) */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Bannières</h1>

        {item ? (
          <Link href={`/dashboard/manage-website/banners/update/${item._id}`}>
            <button className="btn-fit-white-outline">Modifier</button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/banners/create">
            <button className="btn-fit-white-outline">Créer</button>
          </Link>
        )}
      </div>

      {/* Corps avec overlay de chargement cohérent */}
      <div className="relative flex-1 overflow-auto rounded-lg">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
            <FaSpinner className="animate-spin text-3xl" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 text-center text-red-600 bg-white rounded-md border border-primary/20">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Aperçus des visuels */}
            <div className="bg-white rounded-md border border-primary/20 p-4">
              <h2 className="text-lg font-semibold mb-3">Aperçu des bannières</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Meilleure collection */}
                <div className="relative border border-primary/20 rounded-md h-52 overflow-hidden">
                  {item?.BCbannerImgUrl ? (
                    <Image
                      src={item.BCbannerImgUrl}
                      alt="Bannière Meilleure collection"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-center px-2">
                      Aucune bannière “Meilleure collection”
                    </div>
                  )}
                </div>

                {/* Promotions */}
                <div className="relative border border-primary/20 rounded-md h-52 overflow-hidden">
                  {item?.PromotionBannerImgUrl ? (
                    <Image
                      src={item.PromotionBannerImgUrl}
                      alt="Bannière Promotions"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-center px-2">
                      Aucune bannière “Promotions”
                    </div>
                  )}
                </div>

                {/* Nouveaux produits */}
                <div className="relative border border-primary/20 rounded-md h-52 overflow-hidden">
                  {item?.NPBannerImgUrl ? (
                    <Image
                      src={item.NPBannerImgUrl}
                      alt="Bannière Nouveaux produits"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-center px-2">
                      Aucune bannière “Nouveaux produits”
                    </div>
                  )}
                </div>

                {/* Blog */}
                <div className="relative border border-primary/20 rounded-md h-52 overflow-hidden">
                  {item?.BlogBannerImgUrl ? (
                    <Image
                      src={item.BlogBannerImgUrl}
                      alt="Bannière Blog"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-center px-2">
                      Aucune bannière “Blog”
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Titres des bannières */}
            <div className="bg-white rounded-md border border-primary/20 p-4">
              <h2 className="text-lg font-semibold mb-3">Titres</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="bcTitle" className="text-sm text-gray-600">
                    Titre – Meilleure collection
                  </label>
                  <input
                    id="bcTitle"
                    value={T.text(item?.BCbannerTitle)}
                    disabled
                    className="FilterInput bg-white disabled:opacity-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="promoTitle" className="text-sm text-gray-600">
                    Titre – Promotions
                  </label>
                  <input
                    id="promoTitle"
                    value={T.text(item?.PromotionBannerTitle)}
                    disabled
                    className="FilterInput bg-white disabled:opacity-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="npTitle" className="text-sm text-gray-600">
                    Titre – Nouveaux produits
                  </label>
                  <input
                    id="npTitle"
                    value={T.text(item?.NPBannerTitle)}
                    disabled
                    className="FilterInput bg-white disabled:opacity-100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="blogTitle" className="text-sm text-gray-600">
                    Titre – Blog
                  </label>
                  <input
                    id="blogTitle"
                    value={T.text(item?.BlogBannerTitle)}
                    disabled
                    className="FilterInput bg-white disabled:opacity-100"
                  />
                </div>
              </div>
            </div>

            {!item && (
              <div className="p-4 text-center bg-white rounded-md border border-primary/20">
                Aucune donnée de bannières enregistrée.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
