// src/app/dashboard/manage-website/banners/update/[id]/page.tsx
"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MdArrowForwardIos } from "react-icons/md";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";

/* ------------ banner document shape ------------ */
interface BannerDoc {
  _id: string;
  BCbannerImgUrl?: string;
  BCbannerTitle: string;
  PromotionBannerImgUrl?: string;
  PromotionBannerTitle: string;
  NPBannerImgUrl?: string;
  NPBannerTitle: string;
}

/* ------------ editable form fields ------------- */
interface FormFields {
  BCbannerTitle: string;
  PromotionBannerTitle: string;
  NPBannerTitle: string;
}

export default function UpdateBannersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bannerId = params.id;

  /* ---------- state ---------- */
  const [form, setForm] = useState<FormFields>({
    BCbannerTitle: "",
    PromotionBannerTitle: "",
    NPBannerTitle: "",
  });

  const [BCbannerFile, setBCbannerFile] = useState<File | null>(null);
  const [PromotionBannerFile, setPromotionBannerFile] = useState<File | null>(
    null
  );
  const [NPBannerFile, setNPBannerFile] = useState<File | null>(null);

  const [BCpreview, setBCpreview] = useState<string | null>(null);
  const [PromoPreview, setPromoPreview] = useState<string | null>(null);
  const [NPPreview, setNPPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ---------- fetch current doc ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { banners } = await fetchFromAPI<{ banners: BannerDoc }>(
          `/dashboardadmin/website/banners/getBanners`
        );
        if (!banners || banners._id !== bannerId) {
          router.replace("/dashboard/manage-website/banners");
          return;
        }

        setForm({
          BCbannerTitle: banners.BCbannerTitle,
          PromotionBannerTitle: banners.PromotionBannerTitle,
          NPBannerTitle: banners.NPBannerTitle,
        });

        setBCpreview(banners.BCbannerImgUrl ?? null);
        setPromoPreview(banners.PromotionBannerImgUrl ?? null);
        setNPPreview(banners.NPBannerImgUrl ?? null);
      } catch (err) {
        console.error("Load banner doc error:", err);
        setErrorMsg("Failed to load banner data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bannerId, router]);

  /* ------------ handlers ------------ */
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const fileChange =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      previewSetter: React.Dispatch<React.SetStateAction<string | null>>
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setter(file);
      previewSetter(file ? URL.createObjectURL(file) : null);
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (BCbannerFile) data.append("BCbanner", BCbannerFile);
      if (PromotionBannerFile) data.append("PromotionBanner", PromotionBannerFile);
      if (NPBannerFile) data.append("NPBanner", NPBannerFile);

      const res = await fetchFromAPI<{ success: boolean; message?: string }>(
        `/dashboardadmin/website/banners/updateBanners/${bannerId}`,
        { method: "PUT", body: data }
      );

      if (res.success) {
        router.push("/dashboard/manage-website/banners");
      } else {
        setErrorMsg(res.message || "Update failed.");
      }
    } catch (err) {
      console.error("Update banners error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSaving(false);
    }
  };

  /* ------------ helper to render upload cell ------------ */
  const UploadCell = (
    fileSetter: React.Dispatch<React.SetStateAction<File | null>>,
    preview: string | null,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>,
    inputId: keyof FormFields,
    labelText: string,
    accept?: string
  ) => (
    <div className="flex flex-col gap-2">
      <div className="relative h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
        {preview ? (
          <Image src={preview} alt={`${labelText} Preview`} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No {labelText.toLowerCase()} selected
          </div>
        )}
        <input
          type="file"
          accept={accept ?? "image/*"}
          onChange={fileChange(fileSetter, previewSetter)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      <label htmlFor={inputId} className="text-sm font-medium">
        {labelText}
      </label>
      <input
        id={inputId}
        type="text"
        value={form[inputId]}
        onChange={handleTitleChange}
        required
        className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-100"
      />
    </div>
  );

  /* ------------ render ------------ */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header + breadcrumb */}
      <div className="flex flex-col gap-2 h-16">
        <h1 className="text-3xl font-bold">Update Banners</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link href="/dashboard/manage-website/banners" className="text-gray-500 hover:underline">
            Banners
          </Link>
          <MdArrowForwardIos size={14} className="text-gray-400" />
          <span className="text-gray-700 font-medium">Update Entry</span>
        </nav>
      </div>

      {/* Loading / Form */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-3xl text-gray-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {UploadCell(setBCbannerFile, BCpreview, setBCpreview, "BCbannerTitle", "Best-Collection Title")}
            {UploadCell(
              setPromotionBannerFile,
              PromoPreview,
              setPromoPreview,
              "PromotionBannerTitle",
              "Promotion Title"
            )}
            {UploadCell(setNPBannerFile, NPPreview, setNPPreview, "NPBannerTitle", "New-Products Title")}
          </div>

          {/* buttons */}
          <div className="flex justify-center gap-8">
            <Link href="/dashboard/manage-website/banners">
              <button
                type="button"
                disabled={saving}
                className="px-6 py-2 bg-quaternary text-white rounded disabled:opacity-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-tertiary text-white rounded disabled:opacity-50"
            >
              {saving ? "Updating…" : "Update Banners"}
            </button>
          </div>
        </form>
      )}

      {/* overlay / error popup */}
      <Overlay show={saving} />
      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}
