// ───────────────────────────────────────────────────────────────
// src/components/addproductsteps/StepDetails.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { ChangeEvent } from "react";
import Image from "next/image";
import { MdDelete } from "react-icons/md";
import { PiImage } from "react-icons/pi";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";

interface Props {
  form: ProductForm;
  onFixed: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  mainImage: File | null;
  extraImages: File[];
  chooseMain: () => void;
  chooseExtra: () => void;
  clearMain: () => void;
  removeExtra: (index: number) => void;
  existingMainImageUrl?: string | null;
  existingExtraImagesUrls?: string[];
}

export default function StepDetails({
  form,
  onFixed,
  mainImage,
  extraImages,
  chooseMain,
  chooseExtra,
  clearMain,
  removeExtra,
  existingMainImageUrl = null,
  existingExtraImagesUrls = [],
}: Props) {
  return (
    <section className="flex gap-6 h-full">
      {/* ---------- text inputs ---------- */}
      <div className="flex flex-col gap-4 w-1/2 h-full px-6">
        {(["name", "info", "description"] as const).map((k) => (
          <label
            key={k}
            className={
              "flex flex-col gap-1 " + (k === "description" ? "flex-1" : "")
            }
          >
            <span className="text-sm font-medium capitalize">{k}</span>
            {k === "description" ? (
              <textarea
                name={k}
                value={form[k]}
                onChange={onFixed}
                className="border-2 border-gray-300 rounded px-3 py-2 flex-1 h-full resize-none"
              />
            ) : (
              <input
                name={k}
                value={form[k]}
                onChange={onFixed}
                required={k === "name"}
                className="border-2 border-gray-300 rounded px-3 py-2"
              />
            )}
          </label>
        ))}
      </div>

      {/* ---------- image pickers ---------- */}
      <div className="flex flex-col gap-4 w-1/2 h-full">
        {/* Main image */}
        <div
          onClick={chooseMain}
          className="relative border-2 border-gray-300 rounded-lg h-1/2 cursor-pointer hover:border-gray-400 transition"
        >
          <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            <PiImage size={24} />
          </div>

          {mainImage ? (
            /* fresh main preview */
            <div className="relative w-full h-full rounded overflow-hidden">
              <Image
                src={URL.createObjectURL(mainImage)}
                alt="Main Preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearMain();
                }}
                className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
              >
                <MdDelete size={16} className="text-red-600" />
              </button>
            </div>
          ) : existingMainImageUrl ? (
            /* existing main preview */
            <div className="relative w-full h-full rounded overflow-hidden">
              <Image
                src={existingMainImageUrl}
                alt="Current Main"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearMain();
                }}
                className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
              >
                <MdDelete size={16} className="text-red-600" />
              </button>
            </div>
          ) : (
            /* placeholder */
            <div className="flex items-center justify-center h-full text-gray-400 text-center">
              Click to upload
              <br />
              Main Image
            </div>
          )}
        </div>

        {/* Extra images */}
        <div
          onClick={chooseExtra}
          className="relative border-2 border-gray-300 rounded-lg h-1/2 cursor-pointer hover:border-gray-400 transition"
        >
          <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            <PiImage size={24} />
          </div>

          <div className="flex flex-wrap items-start gap-2 p-2 overflow-auto h-full">
            {/* existing extras */}
            {existingExtraImagesUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative w-[80px] h-[100px] rounded overflow-hidden"
              >
                <Image
                  src={url}
                  alt={`Extra ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExtra(idx);
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <MdDelete size={14} className="text-red-600" />
                </button>
              </div>
            ))}

            {/* newly selected extras */}
            {extraImages.map((file, i) => {
              const idx = i + existingExtraImagesUrls.length;
              return (
                <div
                  key={idx}
                  className="relative w-[80px] h-[100px] rounded overflow-hidden"
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`New Extra ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExtra(idx);
                    }}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                  >
                    <MdDelete size={14} className="text-red-600" />
                  </button>
                </div>
              );
            })}

            {existingExtraImagesUrls.length + extraImages.length === 0 && (
              <div className="flex items-center justify-center w-full h-full text-gray-400 text-center">
                Click to upload
                <br />
                Extra Images
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
