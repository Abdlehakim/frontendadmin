// src/app/dashboard/blog/postsubcategorie/update/[subcategorieId]/page.tsx
"use client";

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import Image from "next/image";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface PostCategorie {
  _id: string;
  name: string;
}
interface PostSubCategorieData {
  reference: string;
  name: string;
  vadmin: "approve" | "not-approve";
  postCategorie: string;
  iconUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                */
/* ------------------------------------------------------------------ */
const statusOptions = ["approve", "not-approve"] as const;
/** Loader that bypasses optimisation for local blob previews */
const blobLoader = ({ src }: { src: string }) => src;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function UpdatePostSubCategoriePage() {
  const router = useRouter();
  const { subcategorieId } = useParams() as { subcategorieId: string };

  /* refs for hidden inputs */
  const iconInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  /* UI state */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* form state */
  const [reference, setReference] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"approve" | "not-approve">("approve");
  const [parent, setParent] = useState("");

  /* preview / upload fields */
  const [initialIconUrl, setInitialIconUrl] = useState("");
  const [initialImageUrl, setInitialImageUrl] = useState("");
  const [initialBannerUrl, setInitialBannerUrl] = useState("");

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  /* categories for dropdown */
  const [categories, setCategories] = useState<PostCategorie[]>([]);

  /* ------------------------------------------------------------------ */
  /* Fetch categories + current sub-category                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        /* parent categories */
        const { PostCategories } = await fetchFromAPI<{
          PostCategories: PostCategorie[];
        }>("/dashboardadmin/blog/postCategorie");
        setCategories(PostCategories);

        /* sub-category to edit */
        const { postSubCategorie } = await fetchFromAPI<{
          postSubCategorie: PostSubCategorieData;
        }>(`/dashboardadmin/blog/postsubcategorie/${subcategorieId}`);

        setReference(postSubCategorie.reference);
        setName(postSubCategorie.name);
        setStatus(postSubCategorie.vadmin);
        setParent(postSubCategorie.postCategorie);
        setInitialIconUrl(postSubCategorie.iconUrl ?? "");
        setInitialImageUrl(postSubCategorie.imageUrl ?? "");
        setInitialBannerUrl(postSubCategorie.bannerUrl ?? "");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sub-category."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [subcategorieId]);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                           */
  /* ------------------------------------------------------------------ */
  const handleFile =
    (
      setFile: React.Dispatch<React.SetStateAction<File | null>>,
      clearPreview: React.Dispatch<React.SetStateAction<string>>,
       ref: React.RefObject<HTMLInputElement | null>, 
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setFile(file);
      clearPreview("");
      if (!file && ref.current) ref.current.value = "";
    };

  const clearFile =
    (
      setFile: React.Dispatch<React.SetStateAction<File | null>>,
      setPreview: React.Dispatch<React.SetStateAction<string>>,
      ref: React.RefObject<HTMLInputElement | null>,
    ) =>
    () => {
      setFile(null);
      setPreview("");
      if (ref.current) ref.current.value = "";
    };

  /* ------------------------------------------------------------------ */
  /* Submit                                                             */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("vadmin", status);
      fd.append("postCategorie", parent);

      if (iconFile) fd.append("icon", iconFile);
      if (imageFile) fd.append("image", imageFile);
      if (bannerFile) fd.append("banner", bannerFile);

      await fetchFromAPI(
        `/dashboardadmin/blog/postsubcategorie/update/${subcategorieId}`,
        { method: "PUT", body: fd }
      );

      setShowSuccess(true);
      setTimeout(
        () => router.push("/dashboard/blog/postsubcategorie"),
        1500
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update sub-category."
      );
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  if (loading) return ;

  return (
    <div className="relative mx-auto flex h-full w-[80%] flex-col gap-6 p-4">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Update Sub-Category</h1>
        <nav className="flex items-center gap-2 text-sm underline">
          <Link
            href="/dashboard/blog/postsubcategorie"
            className="text-gray-500 hover:underline"
          >
            All Sub-Categories
          </Link>
          <MdArrowForwardIos size={14} className="text-gray-400" />
          <span className="font-medium text-gray-700">
            Update Sub-Category
          </span>
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Reference (read-only) */}
        <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
          <label className="text-sm font-medium" htmlFor="reference">
            Reference
          </label>
          <input
            id="reference"
            value={reference}
            readOnly
            disabled
            className="rounded border-2 border-gray-300 bg-gray-100 px-3 py-2"
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
          <label className="text-sm font-medium" htmlFor="name">
            Name*
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
            className="rounded border-2 border-gray-300 px-3 py-2 disabled:opacity-50"
          />
        </div>

        {/* Parent category */}
        <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
          <label className="text-sm font-medium" htmlFor="postCategorie">
            Parent Category*
          </label>
          <select
            id="postCategorie"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            required
            disabled={submitting}
            className="rounded border-2 border-gray-300 px-3 py-2 disabled:opacity-50"
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2 md:w-1/2 lg:w-2/5">
          <label className="text-sm font-medium" htmlFor="status">
            Status*
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "approve" | "not-approve")
            }
            required
            disabled={submitting}
            className="rounded border-2 border-gray-300 px-3 py-2 disabled:opacity-50"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* File uploads */}
        <div className="flex w-full flex-col gap-4 lg:flex-row">
          {[
            {
              label: "Icon",
              file: iconFile,
              initialUrl: initialIconUrl,
              setFile: setIconFile,
              setPreview: setInitialIconUrl,
              ref: iconInput,
            },
            {
              label: "Image",
              file: imageFile,
              initialUrl: initialImageUrl,
              setFile: setImageFile,
              setPreview: setInitialImageUrl,
              ref: imageInput,
            },
            {
              label: "Banner",
              file: bannerFile,
              initialUrl: initialBannerUrl,
              setFile: setBannerFile,
              setPreview: setInitialBannerUrl,
              ref: bannerInput,
            },
          ].map(({ label, file, initialUrl, setFile, setPreview, ref }) => (
            <div
              key={label}
              onClick={() => ref.current?.click()}
              className="relative h-72 flex-1 cursor-pointer rounded-lg border-2 border-gray-300 transition hover:border-gray-400"
            >
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile(setFile, setPreview, ref)}
                disabled={submitting}
              />

              <div className="absolute right-2 top-2 text-gray-500">
                <PiImage size={24} />
              </div>

              {/* Preview */}
              {file || initialUrl ? (
                <div className="relative h-full w-full overflow-hidden rounded">
                  <Image
                    src={file ? URL.createObjectURL(file) : initialUrl}
                    loader={file ? blobLoader : undefined}
                    alt={label}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearFile(setFile, setPreview, ref)}
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

        {/* Actions */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/blog/postsubcategorie">
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
            {submitting ? "Updating…" : "Update Sub-Category"}
          </button>
        </div>
      </form>

      {/* Overlay + errors */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Sub-category updated" : undefined}
        spinnerSize={60}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
