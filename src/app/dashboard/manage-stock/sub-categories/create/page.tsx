// src/app/manage-stock/sub-categories/create/page.tsx

"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdArrowForwardIos, MdDelete } from "react-icons/md";
import Overlay from "@/components/Overlay";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Image from "next/image";
import { PiImage } from "react-icons/pi";

interface Category {
  _id: string;
  name: string;
}

interface FormData {
  name: string;
  categorie: string;
}

export default function CreateSubCategoryPage() {
  const router = useRouter();
  const iconInput = useRef<HTMLInputElement | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const bannerInput = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormData>({ name: "", categorie: "" });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load parent categories
  useEffect(() => {
    (async () => {
      try {
        const { categories } = await fetchFromAPI<{
          categories: Category[];
        }>("/dashboardadmin/stock/categories");
        setCategories(categories);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setter(file);
      if (!file && inputRef.current) inputRef.current.value = "";
    };

  const clearFile =
    (
      setter: React.Dispatch<React.SetStateAction<File | null>>,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) =>
    () => {
      setter(null);
      if (inputRef.current) inputRef.current.value = "";
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("categorie", form.categorie);
      if (iconFile) fd.append("icon", iconFile);
      if (imageFile) fd.append("image", imageFile);
      if (bannerFile) fd.append("banner", bannerFile);

      await fetchFromAPI<{ message: string }>(
        "/dashboardadmin/stock/subcategories/create",
        {
          method: "POST",
          body: fd,
        }
      );

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/manage-stock/sub-categories");
      }, 1500);
    } catch (err: unknown) {
      console.error("Creation failed:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create sub-category.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Create Sub-Category</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-stock/sub-categories"
            className="text-gray-500 hover:underline"
          >
            All Sub-Categories
          </Link>
          <MdArrowForwardIos className="text-gray-400" size={14} />
          <span className="text-gray-700 font-medium">
            Create Sub-Category
          </span>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Name */}
        <div className="flex items-center gap-4">
          <label htmlFor="name" className="w-1/4 text-sm font-medium">
            Name*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleInputChange}
            required
            className="flex-1 border border-gray-300 bg-inputcolor rounded px-3 py-2"
          />
        </div>

        {/* Parent Category */}
        <div className="flex items-center gap-4">
          <label htmlFor="categorie" className="w-1/4 text-sm font-medium">
            Category*
          </label>
          <select
            id="categorie"
            name="categorie"
            value={form.categorie}
            onChange={handleInputChange}
            required
            disabled={loadingCats}
            className="flex-1 border border-gray-300 bg-inputcolor rounded px-3 py-2"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Icon / Image / Banner Uploads */}
        <div className="flex max-lg:flex-col w-full gap-4">
          {/* Icon */}
          <div
            className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => iconInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            {iconFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={URL.createObjectURL(iconFile)}
                  alt="Icon preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile(setIconFile, iconInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={iconInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(setIconFile, iconInput)}
                />
                <div className="flex items-center justify-center h-full text-gray-400">
                  Click to upload
                  <br />
                  Icon
                </div>
              </>
            )}
          </div>

          {/* Image */}
          <div
            className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => imageInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            {imageFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={URL.createObjectURL(imageFile)}
                  alt="Image preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile(setImageFile, imageInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={imageInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(setImageFile, imageInput)}
                />
                <div className="flex items-center justify-center h-full text-gray-400">
                  Click to upload
                  <br />
                  Image
                </div>
              </>
            )}
          </div>

          {/* Banner */}
          <div
            className="relative border-2 lg:w-1/3 border-gray-300 rounded-lg h-72 cursor-pointer hover:border-gray-400 transition"
            onClick={() => bannerInput.current?.click()}
          >
            <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <PiImage size={24} />
            </div>
            {bannerFile ? (
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={URL.createObjectURL(bannerFile)}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile(setBannerFile, bannerInput)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={bannerInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(setBannerFile, bannerInput)}
                />
                <div className="flex items-center justify-center h-full text-gray-400">
                  Click to upload
                  <br />
                  Banner
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-8">
          <Link href="/dashboard/manage-stock/sub-categories">
            <button
              type="button"
              disabled={submitting}
              className="px-6 py-2 bg-quaternary text-white rounded"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-tertiary text-white rounded"
          >
            {submitting ? "Adding..." : "Add Sub-Category"}
          </button>
        </div>
      </form>

      {/* Overlay & Error Popup */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Sub-category created successfully" : undefined}
      />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
