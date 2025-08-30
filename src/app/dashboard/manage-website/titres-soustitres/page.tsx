"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSpinner } from "react-icons/fa6";

interface WebsiteTitres {
  _id: string;
  SimilarProductTitre: string;
  SimilarProductSubTitre: string;
}

export default function WebsiteTitresAdminPage() {
  const [item, setItem] = useState<WebsiteTitres | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { websiteTitres } =
          await fetchFromAPI<{ websiteTitres: WebsiteTitres[] }>(
            "/dashboardadmin/website/getWebsiteTitres"
          );
        setItem(websiteTitres[0] ?? null);
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
        <h1 className="text-3xl font-bold uppercase">Titres &amp; Sous-titres</h1>
        {item ? (
          <Link href={`/dashboard/manage-website/titres-soustitres/update/${item._id}`}>
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Update
            </button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/titres-soustitres/create">
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
          {/* Similar Product Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Similar Product Title</label>
            <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
              {item?.SimilarProductTitre ?? ""}
            </div>
          </div>

          {/* Similar Product SubTitle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Similar Product Sub Title</label>
            <div className="flex items-center border-2 border-gray-300 rounded px-3 h-10 bg-gray-50">
              {item?.SimilarProductSubTitre ?? ""}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
