// src/components/productattribute/Color.tsx
"use client";

import React from "react";
import Image from "next/image";
import { FiPlus, FiX, FiImage } from "react-icons/fi";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                    */
/* ------------------------------------------------------------------ */
export interface ColorPair {
  name: string;
  hex: string;
  image?: string; // preview URL
}

interface Props {
  colors: ColorPair[];
  onChange: (next: ColorPair[]) => void;
  onFileSelect: (file: File, fieldName: string) => void;
  onRowDelete?: (fieldName: string) => void;   //  ← NEW (optional)
  attributeIndex: number;
}

const makeKey = (attrIdx: number, rowIdx: number) =>
  `attributeImages-${attrIdx}-${rowIdx}`;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function Color({
  colors,
  onChange,
  onFileSelect,
  onRowDelete = () => {},        // graceful default
  attributeIndex,
}: Props) {
  /* field updates */
  const update = (i: number, field: keyof ColorPair, val: string) => {
    const next = [...colors];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  /* image helpers */
  const selectImage = (rowIdx: number, file: File) => {
    const key = makeKey(attributeIndex, rowIdx);
    onFileSelect(file, key);
    update(rowIdx, "image", URL.createObjectURL(file));
  };

  const clearImage = (rowIdx: number) => {
    const key = makeKey(attributeIndex, rowIdx);
    onRowDelete(key);
    update(rowIdx, "image", "");
  };

  /* row helpers */
  const addRow = () =>
    onChange([...colors, { name: "", hex: "#000000", image: "" }]);

  const removeRow = (i: number) => {
    if (colors.length <= 1) return;
    onRowDelete(makeKey(attributeIndex, i));    // drop file if any
    onChange(colors.filter((_, idx) => idx !== i));
  };

  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col rounded p-2">
      {/* header */}
      <div className="flex gap-2 text-xs font-semibold text-gray-600 bg-white px-2 py-1 sticky top-0 z-10">
        <div className="w-1/3">Name</div>
        <div className="w-1/3">Color</div>
        <div className="w-1/3">Image</div>
      </div>

      {/* rows */}
      <div className="flex flex-col">
        {colors.map((c, idx) => {
          const canDelete = colors.length > 1;
          const key = makeKey(attributeIndex, idx);

          return (
            <div
              key={idx}
              className={`flex gap-2 items-center px-2 py-2 ${
                idx % 2 === 0 ? "bg-gray-50" : ""
              } hover:bg-gray-100`}
            >
              {/* name */}
              <input
                className="border px-2 py-1 rounded w-1/3"
                placeholder="e.g. Red"
                value={c.name}
                onChange={(e) => update(idx, "name", e.target.value)}
              />

              {/* hex picker */}
              <input
                type="color"
                value={c.hex}
                onChange={(e) => update(idx, "hex", e.target.value)}
                className="w-1/3 h-8 p-0 border rounded"
              />

              {/* image cell */}
              <div className="w-1/3 flex justify-center items-center gap-2 relative">
                {/* upload icon */}
                {!c.image && (
                  <label
                    className="flex items-center gap-1 text-gray-600 cursor-pointer hover:text-blue-600"
                    title="Upload image"
                  >
                    <FiImage className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      name={key}
                      onChange={(e) =>
                        e.target.files?.[0] && selectImage(idx, e.target.files[0])
                      }
                      className="hidden"
                    />
                  </label>
                )}

                {/* preview + clear */}
                {c.image && (
                  <div className="relative w-8 h-8 group rounded overflow-hidden border">
                    <Image
                      src={c.image}
                      alt="Preview"
                      width={32}
                      height={32}
                      className="object-cover w-8 h-8"
                    />
                    <button
                      type="button"
                      onClick={() => clearImage(idx)}
                      title="Remove image"
                      className="absolute inset-0 bg-white/80 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* delete row */}
              <button
                type="button"
                title={canDelete ? "Remove color" : "At least one color required"}
                disabled={!canDelete}
                onClick={() => removeRow(idx)}
                className={
                  canDelete ? "text-red-600" : "text-gray-400 cursor-not-allowed"
                }
              >
                <FiX />
              </button>
            </div>
          );
        })}
      </div>

      {/* add row */}
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-blue-600 flex items-center gap-1 text-sm hover:underline"
      >
        <FiPlus /> add More
      </button>
    </div>
  );
}
