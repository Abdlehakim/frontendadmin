"use client";

import React from "react";
import Image from "next/image";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";
import type {
  AttributePayload,
  ProductDetailPair,
} from "@/components/addproductsteps/StepAttributesDetails";

interface Props {
  form: ProductForm;

  /* draft uploads (create-flow) */
  mainImage: File | null;
  extraImages?: File[];

  /* existing URLs when editing (optional) */
  existingMainImageUrl?: string | null;
  existingExtraImagesUrls?: string[];

  /* attribute & detail payloads */
  attrPayload: AttributePayload[];
  detailsPayload: ProductDetailPair[];
}

export default function StepReview({
  form,
  mainImage,
  extraImages = [],
  existingMainImageUrl,
  existingExtraImagesUrls = [],
  attrPayload,
  detailsPayload,
}: Props) {
  /* ---------------------------------------------------------------- */
  /* helpers                                                          */
  /* ---------------------------------------------------------------- */
  const filePreview = (file: File) => URL.createObjectURL(file);

  /* ---------------------------------------------------------------- */
  /* render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-2xl font-bold">Review Details</h2>

      {/* ---------------------------------------------------------------- */}
      {/* basic product fields                                             */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-wrap gap-8">
        {/* text fields */}
        <div className="space-y-1 min-w-[300px]">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <strong className="capitalize">{key}:</strong>{" "}
              <span className="break-all">{value}</span>
            </div>
          ))}
        </div>

        {/* main image */}
        <div className="flex flex-col items-center gap-2">
          <strong>Main Image</strong>
          {mainImage ? (
            <Image
              src={filePreview(mainImage)}
              alt="preview"
              width={120}
              height={160}
              className="object-cover rounded border"
            />
          ) : existingMainImageUrl ? (
            <Image
              src={existingMainImageUrl}
              alt="existing main"
              width={120}
              height={160}
              className="object-cover rounded border"
            />
          ) : (
            <span className="text-sm text-gray-500">No image</span>
          )}
        </div>

        {/* extra images */}
        {(extraImages.length > 0 || existingExtraImagesUrls.length > 0) && (
          <div className="flex flex-col gap-2">
            <strong>Extra Images</strong>
            <div className="flex flex-wrap gap-2">
              {extraImages.map((f, i) => (
                <Image
                  key={`new-${i}`}
                  src={filePreview(f)}
                  alt="extra"
                  width={60}
                  height={60}
                  className="object-cover rounded border"
                />
              ))}
              {existingExtraImagesUrls.map((url) => (
                <Image
                  key={url}
                  src={url}
                  alt="extra"
                  width={60}
                  height={60}
                  className="object-cover rounded border"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* attributes                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div>
        <h3 className="font-semibold mb-2">Attributes</h3>
        {attrPayload.length === 0 ? (
          <p className="text-sm text-gray-500">No attributes selected.</p>
        ) : (
          <ul className="space-y-3">
            {attrPayload.map((p) => (
              <li key={p.attributeSelected}>
                <strong className="block mb-1">{p.attributeName}:</strong>

                {/* array-based payload */}
                {Array.isArray(p.value) ? (
                  <div className="ml-4 space-y-1">
                    {p.value.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="whitespace-pre">
                          {item.name}
                          {"value" in item && item.value ? `: ${item.value}` : ""}
                          {"hex" in item && item.hex ? `: ${item.hex}` : ""}
                        </span>

                        {/* colour chip */}
                        {"hex" in item && item.hex && (
                          <span
                            className="inline-block w-4 h-4 rounded border"
                            style={{ background: item.hex }}
                          />
                        )}

                        {/* image thumb */}
                        {"image" in item && item.image && (
                          <Image
                            src={item.image}
                            alt="Attribute"
                            width={32}
                            height={32}
                            className="object-cover rounded border"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* scalar payload */
                  <span className="ml-4">{p.value}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* product details                                                  */}
      {/* ---------------------------------------------------------------- */}
      <div>
        <h3 className="font-semibold mb-2">Product Details</h3>
        {detailsPayload.length === 0 ? (
          <p className="text-sm text-gray-500">No product details.</p>
        ) : (
          <ul className="space-y-3">
            {detailsPayload.map((d, i) => (
              <li key={i} className="flex items-center gap-3">
                <span>
                  <strong>{d.name}:</strong>{" "}
                  {d.description ?? <em className="text-gray-500">—</em>}
                </span>

                {d.image && (
                  <Image
                    src={d.image}
                    alt={d.name}
                    width={300}
                    height={300}
                    className="object-cover rounded border"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
