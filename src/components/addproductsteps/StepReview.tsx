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
  mainImage: File | null;
  existingMainImageUrl?: string | null;
  extraImages?: File[];
  existingExtraImagesUrls?: string[];
  attrPayload: AttributePayload[];
  detailsPayload: ProductDetailPair[];
}

export default function StepReview({
  form,
  mainImage,
  attrPayload,
  detailsPayload,
}: Props) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Review Details</h2>

      {/* Basic form fields */}
      <div className="flex gap-8 justify-between">
        <div className="space-y-2">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <strong className="capitalize">{key}:</strong> {value}
            </div>
          ))}
        </div>

        {/* Main image preview */}
        <div className="flex flex-col items-center">
          <strong>Main Image</strong>
          {mainImage && (
            <Image
              src={URL.createObjectURL(mainImage)}
              alt="preview"
              width={100}
              height={150}
              className="object-cover rounded"
            />
          )}
        </div>
      </div>

      {/* Attributes */}
      <div>
        <h3 className="font-semibold">Attributes</h3>
        {attrPayload.length === 0 ? (
          <p className="text-sm text-gray-500">No attributes selected.</p>
        ) : (
          <ul className="list-disc pl-6 space-y-1">
            {attrPayload.map((p) => {
              const displayValue = Array.isArray(p.value)
                ? p.value
                    .map((item) =>
                      typeof item === "string"
                        ? item
                        : "value" in item
                        ? `${item.name}: ${item.value}`
                        : `${item.name}: ${item.hex}`
                    )
                    .join(", ")
                : p.value;

              return (
                <li key={p.attributeSelected}>
                  <strong>{p.attributeName}:</strong> {displayValue}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Product Details */}
      <div>
        <h3 className="font-semibold">Product Details</h3>
        {detailsPayload.length === 0 ? (
          <p className="text-sm text-gray-500">No product details.</p>
        ) : (
          <ul className="list-disc pl-6 space-y-1">
            {detailsPayload.map((d, i) => (
              <li key={i}>
                <strong>{d.name}:</strong> {d.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
