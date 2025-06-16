// src/app/dashboard/manage-website/company-data/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface CompanyData {
  _id: string;
  name: string;
  description: string;
  bannerImageUrl?: string;
  logoImageUrl?: string;
  contactBannerUrl?: string;
  email: string;
  phone?: number;
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
}

export default function CompanyDataAdminPage() {
  const [item, setItem] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { companyInfo } = await fetchFromAPI<{
          companyInfo: CompanyData;
        }>("/dashboardadmin/website/company-info/getCompanyInfo");
        setItem(companyInfo ?? null);
      } catch (err: unknown) {
        if (err instanceof Error && /not found/i.test(err.message)) {
          setItem(null);
        } else {
          console.error("Fetch Company Data Error:", err);
          setError("Failed to load company data.");
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
        <h1 className="text-3xl font-bold uppercase">Company Data</h1>
        {item ? (
          <Link href={`/dashboard/manage-website/company-data/update/${item._id}`}>
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Update
            </button>
          </Link>
        ) : (
          <Link href="/dashboard/manage-website/company-data/create">
            <button className="px-4 py-2 bg-tertiary text-white rounded hover:opacity-90">
              Create
            </button>
          </Link>
        )}
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <div className="flex flex-col gap-4 py-6">
          {/* Logo, Banner & Contact Banner */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Logo */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-1/5 overflow-hidden">
              {item?.logoImageUrl ? (
                <Image
                  src={item.logoImageUrl}
                  alt="Company Logo"
                  fill
                  className="object-contain p-4"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No logo uploaded
                </div>
              )}
            </div>

            {/* Main Banner */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-2/5 overflow-hidden">
              {item?.bannerImageUrl ? (
                <Image
                  src={item.bannerImageUrl}
                  alt="Company Banner"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No banner uploaded
                </div>
              )}
            </div>

            {/* Contact Banner */}
            <div className="relative border-2 border-gray-300 rounded-lg h-64 md:w-2/5 overflow-hidden">
              {item?.contactBannerUrl ? (
                <Image
                  src={item.contactBannerUrl}
                  alt="Contact Banner"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No contact banner uploaded
                </div>
              )}
            </div>
          </div>


          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <input
                id="name"
                type="text"
                value={item?.name ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={item?.email ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone</label>
              <input
                id="phone"
                type="text"
                value={item?.phone?.toString() ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              rows={4}
              value={item?.description ?? ""}
              disabled
              className="border-2 border-gray-300 rounded p-2 bg-gray-100 w-full"
            />
          </div>

          <hr className="border-t border-gray-300 mb-4" />

          {/* Address Info */}
          <h2 className="text-xl font-semibold uppercase">Address Info</h2>
          <hr className="border-t border-gray-300 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address */}
            <div className="flex flex-col gap-2">
              <label htmlFor="address" className="text-sm font-medium">Address</label>
              <input
                id="address"
                type="text"
                value={item?.address ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            {/* City */}
            <div className="flex flex-col gap-2">
              <label htmlFor="city" className="text-sm font-medium">City</label>
              <input
                id="city"
                type="text"
                value={item?.city ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            {/* Zipcode */}
            <div className="flex flex-col gap-2">
              <label htmlFor="zipcode" className="text-sm font-medium">Zipcode</label>
              <input
                id="zipcode"
                type="text"
                value={item?.zipcode ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            {/* Governorate */}
            <div className="flex flex-col gap-2">
              <label htmlFor="governorate" className="text-sm font-medium">Governorate</label>
              <input
                id="governorate"
                type="text"
                value={item?.governorate ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
          </div>

          <hr className="border-t border-gray-300 mb-4" />

          {/* Social Media */}
          <h2 className="text-xl font-semibold uppercase">Social Media</h2>
          <hr className="border-t border-gray-300 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
            {/* Facebook */}
            <div className="flex flex-col gap-2">
              <label htmlFor="facebook" className="text-sm font-medium">Facebook</label>
              <input
                id="facebook"
                type="text"
                value={item?.facebook ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            {/* LinkedIn */}
            <div className="flex flex-col gap-2">
              <label htmlFor="linkedin" className="text-sm font-medium">LinkedIn</label>
              <input
                id="linkedin"
                type="text"
                value={item?.linkedin ?? ""}
                disabled
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            {/* Instagram */}
            <div className="flex flex-col gap-2">
              <label htmlFor="instagram" className="text-sm font-medium">Instagram</label>
              <input
                id="instagram"
                type="text"
                value={item?.instagram ?? ""}
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
