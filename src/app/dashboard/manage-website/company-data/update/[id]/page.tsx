// src/app/dashboard/manage-website/company-data/update/[id]/page.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { MdArrowForwardIos } from "react-icons/md";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface FormFields {
  name: string;
  description: string;
  email: string;
  phone: string;
  vat: string;            // ← NEW: Matricule fiscale
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  facebook: string;
  linkedin: string;
  instagram: string;
}

export default function UpdateCompanyDataPage() {
  /* ------------------ hooks ------------------ */
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  /* ------------------ refs ------------------ */
  const bannerInput = useRef<HTMLInputElement | null>(null);
  const logoInput = useRef<HTMLInputElement | null>(null);
  const contactBannerInput = useRef<HTMLInputElement | null>(null);

  /* ------------------ state ------------------ */
  const [form, setForm] = useState<FormFields>({
    name: "",
    description: "",
    email: "",
    phone: "",
    vat: "",             // ← NEW
    address: "",
    city: "",
    zipcode: "",
    governorate: "",
    facebook: "",
    linkedin: "",
    instagram: "",
  });

  const [bannerPreview, setBannerPreview] = useState<string | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [contactBannerPreview, setContactBannerPreview] = useState<string | undefined>();

  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();

  /* ------------------ constants ------------------ */
  const basicFields: Array<keyof Pick<FormFields, "name" | "email" | "phone" | "vat">> = [
    "name",
    "email",
    "phone",
    "vat",               // ← NEW: include in basic section
  ];
  const addressFields: Array<
    keyof Pick<FormFields, "address" | "city" | "zipcode" | "governorate">
  > = ["address", "city", "zipcode", "governorate"];
  const socialFields: Array<keyof Pick<FormFields, "facebook" | "linkedin" | "instagram">> = [
    "facebook",
    "linkedin",
    "instagram",
  ];

  /* ------------------ fetch existing ------------------ */
  useEffect(() => {
    (async () => {
      try {
        const { companyInfo } = await fetchFromAPI<{
          companyInfo: {
            name: string;
            description: string;
            email: string;
            phone: string | number;
            vat?: string;              // ← NEW
            address: string;
            city: string;
            zipcode: string;
            governorate: string;
            facebook?: string;
            linkedin?: string;
            instagram?: string;
            bannerImageUrl?: string;
            logoImageUrl?: string;
            contactBannerUrl?: string;
          };
        }>(`/dashboardadmin/website/company-info/getCompanyInfo`);

        if (companyInfo) {
          setForm({
            name: companyInfo.name,
            description: companyInfo.description,
            email: companyInfo.email,
            phone: companyInfo.phone?.toString?.() ?? String(companyInfo.phone ?? ""),
            vat: companyInfo.vat ?? "",                         // ← NEW
            address: companyInfo.address,
            city: companyInfo.city,
            zipcode: companyInfo.zipcode,
            governorate: companyInfo.governorate,
            facebook: companyInfo.facebook ?? "",
            linkedin: companyInfo.linkedin ?? "",
            instagram: companyInfo.instagram ?? "",
          });
          setBannerPreview(companyInfo.bannerImageUrl);
          setLogoPreview(companyInfo.logoImageUrl);
          setContactBannerPreview(companyInfo.contactBannerUrl);
        }
      } catch (err) {
        console.error("Load company data failed", err);
        setErrorMsg("Failed to load existing company data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  /* ------------------ handlers ------------------ */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg(undefined);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => data.append(key, val));
      if (bannerInput.current?.files?.[0]) data.append("banner", bannerInput.current.files[0]);
      if (logoInput.current?.files?.[0]) data.append("logo", logoInput.current.files[0]);
      if (contactBannerInput.current?.files?.[0])
        data.append("contactBanner", contactBannerInput.current.files[0]);

      await fetchFromAPI<{ success: boolean }>(
        `/dashboardadmin/website/company-info/updateCompanyInfo/${companyId}`,
        { method: "PUT", body: data }
      );

      router.push("/dashboard/manage-website/company-data");
    } catch (err) {
      console.error("Update error", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while updating."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ------------------ render ------------------ */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <FaSpinner className="animate-spin text-3xl text-gray-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header + Breadcrumb */}
      <div className="flex justify-start gap-2 flex-col h-16">
        <h1 className="text-3xl font-bold">Update Company Data</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-website/company-data"
            className="text-gray-500 hover:underline"
          >
            Company Data
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">Update Entry</span>
        </nav>
      </div>

      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(undefined)} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
        {/* Logos & Banners */}
        <div className="flex flex-col md:flex-row gap-4">
          {[
            { label: "Logo", preview: logoPreview, ref: logoInput, set: setLogoPreview },
            { label: "Banner", preview: bannerPreview, ref: bannerInput, set: setBannerPreview },
            {
              label: "Contact Banner",
              preview: contactBannerPreview,
              ref: contactBannerInput,
              set: setContactBannerPreview,
            },
          ].map(({ label, preview, ref, set }) => (
            <div key={label} className="relative flex-1 border-2 border-gray-300 rounded-lg h-64 overflow-hidden">
              {preview ? (
                <Image src={preview} alt={label} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No {label.toLowerCase()} uploaded
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={ref}
                onChange={(e) => handleFileChange(e, set)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* Basic Info (now includes VAT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {basicFields.map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <label htmlFor={field} className="text-sm font-medium">
                {field === "vat"
                  ? "VAT / Matricule fiscale"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field}
                type={field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={handleChange}
                required
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            required
            className="border-2 border-gray-300 rounded p-2 bg-gray-100 w-full"
          />
        </div>

        <hr className="border-t border-gray-300 mb-4" />

        {/* Address Info */}
        <h2 className="text-xl font-semibold uppercase">Address Info</h2>
        <hr className="border-t border-gray-300 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addressFields.map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <label htmlFor={field} className="text-sm font-medium">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field}
                type="text"
                value={form[field]}
                onChange={handleChange}
                required
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
          ))}
        </div>

        <hr className="border-t border-gray-300 mb-4" />

        {/* Social Media */}
        <h2 className="text-xl font-semibold uppercase">Social Media</h2>
        <hr className="border-t border-gray-300 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {socialFields.map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <label htmlFor={field} className="text-sm font-medium">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field}
                type="text"
                value={form[field]}
                onChange={handleChange}
                className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
          ))}
        </div>

        {/* Submit + Cancel */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-website/company-data">
            <button
              type="button"
              disabled={submitLoading}
              className="px-6 py-2 bg-quaternary text-white rounded disabled:opacity-50"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitLoading}
            className="px-6 py-2 bg-tertiary text-white rounded disabled:opacity-50 flex items-center gap-2"
          >
            {submitLoading && <FaSpinner className="animate-spin" />}
            {submitLoading ? "Updating…" : "Update Company Data"}
          </button>
        </div>
      </form>

      {/* overlay */}
      <Overlay show={submitLoading} />
    </div>
  );
}
