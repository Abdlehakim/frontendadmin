// src/app/dashboard/blog/postcategorie/update/[categorieId]/page.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Image from "next/image";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

interface PostCategorieData {
  reference: string;
  name: string;
  vadmin: "approve" | "not-approve";
  iconUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
}

const statusOptions = ["approve", "not-approve"] as const;

export default function UpdatePostCategoriePage() {
  /* --------------------------------------------------------------------- */
  /* Hooks & refs                                                          */
  /* --------------------------------------------------------------------- */
  const router = useRouter();
  const { categorieId } = useParams() as { categorieId: string };

  const iconInput = useRef<HTMLInputElement | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const bannerInput = useRef<HTMLInputElement | null>(null);

  /* --------------------------------------------------------------------- */
  /* Local state                                                           */
  /* --------------------------------------------------------------------- */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reference, setReference] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] =
    useState<typeof statusOptions[number]>("approve");

  const [initialIconUrl, setInitialIconUrl] = useState("");
  const [initialImageUrl, setInitialImageUrl] = useState("");
  const [initialBannerUrl, setInitialBannerUrl] = useState("");

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  /* --------------------------------------------------------------------- */
  /* Fetch current category                                                */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchFromAPI<{ postCategorie: PostCategorieData }>(
          `/dashboardadmin/blog/postcategorie/${categorieId}`,
        );
        const data = res.postCategorie;
        setReference(data.reference);
        setName(data.name);
        setStatus(data.vadmin);
        if (data.iconUrl) setInitialIconUrl(data.iconUrl);
        if (data.imageUrl) setInitialImageUrl(data.imageUrl);
        if (data.bannerUrl) setInitialBannerUrl(data.bannerUrl);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load post category.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [categorieId]);

  /* --------------------------------------------------------------------- */
  /* Helpers                                                               */
  /* --------------------------------------------------------------------- */
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setName(e.target.value);

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setStatus(e.target.value as typeof statusOptions[number]);

  const handleFileChange =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      clearInitial: React.Dispatch<React.SetStateAction<string>>,
      inputRef: React.RefObject<HTMLInputElement | null>,
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setter(file);
      clearInitial("");
      if (!file && inputRef.current) inputRef.current.value = "";
    };

  const clearFile =
    (
      setterFile: React.Dispatch<React.SetStateAction<File | null>>,
      setterInitial: React.Dispatch<React.SetStateAction<string>>,
      inputRef: React.RefObject<HTMLInputElement | null>,
    ) =>
    () => {
      setterFile(null);
      setterInitial("");
      if (inputRef.current) inputRef.current.value = "";
    };

  /* --------------------------------------------------------------------- */
  /* Submit                                                                */
  /* --------------------------------------------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("vadmin", status);
      if (iconFile) fd.append("icon", iconFile);
      if (imageFile) fd.append("image", imageFile);
      if (bannerFile) fd.append("banner", bannerFile);

      await fetchFromAPI(
        `/dashboardadmin/blog/postcategorie/update/${categorieId}`,
        { method: "PUT", body: fd },
      );

      setShowSuccess(true);
      setTimeout(
        () => router.push("/dashboard/blog/postcategorie"),
        1500,
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update post category.",
      );
      setSubmitting(false);
    }
  };

  /* --------------------------------------------------------------------- */
  /* Render                                                                */
  /* --------------------------------------------------------------------- */
  if (loading) return ;

  return (
    <div className="relative mx-auto flex h-full w-[80%] flex-col gap-6 p-4">
      {/* ------------------------------------------------------------------ */}
      {/* Title & breadcrumb                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Update Post Category</h1>
        <nav className="flex items-center gap-2 text-sm underline">
          <Link
            href="/dashboard/blog/postcategorie"
            className="text-gray-500 hover:underline"
          >
            All Categories
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="font-medium text-gray-700">
            Update Category
          </span>
        </nav>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Form                                                               */}
      {/* ------------------------------------------------------------------ */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Reference (read-only) */}
        <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
          <label htmlFor="reference" className="text-sm font-medium">
            Reference
          </label>
          <input
            id="reference"
            type="text"
            value={reference}
            readOnly
            disabled
            className="rounded border-2 border-gray-300 bg-gray-100 px-3 py-2"
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
          <label htmlFor="name" className="text-sm font-medium">
            Name*
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            required
            disabled={submitting}
            className="rounded border-2 border-gray-300 px-3 py-2 disabled:opacity-50"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
          <label htmlFor="status" className="text-sm font-medium">
            Status*
          </label>
          <select
            id="status"
            value={status}
            onChange={handleStatusChange}
            required
            disabled={submitting}
            className="rounded border-2 border-gray-300 px-3 py-2 disabled:opacity-50"
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* File uploads (icon / image / banner)                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex w-full flex-col gap-4 lg:flex-row">
          {[
            {
              label: "Icon",
              file: iconFile,
              initialUrl: initialIconUrl,
              setFile: setIconFile,
              setInitial: setInitialIconUrl,
              ref: iconInput,
            },
            {
              label: "Image",
              file: imageFile,
              initialUrl: initialImageUrl,
              setFile: setImageFile,
              setInitial: setInitialImageUrl,
              ref: imageInput,
            },
            {
              label: "Banner",
              file: bannerFile,
              initialUrl: initialBannerUrl,
              setFile: setBannerFile,
              setInitial: setInitialBannerUrl,
              ref: bannerInput,
            },
          ].map(({ label, file, initialUrl, setFile, setInitial, ref }) => (
            <div
              key={label}
              className="relative h-72 flex-1 cursor-pointer rounded-lg border-2 border-gray-300 transition hover:border-gray-400"
              onClick={() => ref.current?.click()}
            >
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange(setFile, setInitial, ref)}
                disabled={submitting}
              />
              <div className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
                <PiImage size={24} />
              </div>

              {/* Preview */}
              {file || initialUrl ? (
                <div className="relative h-full w-full overflow-hidden rounded">
                  <Image
                    src={
                      file
                        ? URL.createObjectURL(file)
                        : (initialUrl as string)
                    }
                    alt={label}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearFile(setFile, setInitial, ref)}
                    disabled={submitting}
                    className="absolute right-1 top-1 rounded-full bg-white p-1 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <MdDelete size={16} className="text-red-600" />
                  </button>
                </div>
              ) : (
                <div className="pointer-events-none flex h-full flex-col items-center justify-center text-gray-400">
                  Click to upload
                  <br />
                  {label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Actions                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/blog/postcategorie">
            <button
              type="button"
              disabled={submitting}
              className="rounded bg-quaternary px-6 py-2 text-white disabled:opacity-50"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-tertiary px-6 py-2 text-white disabled:opacity-50"
          >
            {submitting ? "Updating…" : "Update Category"}
          </button>
        </div>
      </form>

      {/* ------------------------------------------------------------------ */}
      {/* Overlay & feedback                                                 */}
      {/* ------------------------------------------------------------------ */}
      <Overlay
        show={submitting || showSuccess}
        message={
          showSuccess ? "Category updated successfully" : undefined
        }
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
