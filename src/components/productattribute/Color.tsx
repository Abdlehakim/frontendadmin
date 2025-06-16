// src/components/productattribute/Color.tsx
"use client";

import React from "react";
import { FiPlus, FiX } from "react-icons/fi";

/* ——— public pair type ——— */
export interface ColorPair {
  name: string;
  hex: string; // e.g. #ff0000
}

/* ——— props ——— */
interface Props {
  colors: ColorPair[];
  onChange: (next: ColorPair[]) => void;
}

/* ======================================================================= */
export default function Color({ colors, onChange }: Props) {
  /* update helper */
  const update = (i: number, field: keyof ColorPair, val: string) => {
    const next = [...colors];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  /* add row */
  const addRow = () => onChange([...colors, { name: "", hex: "#000000" }]);

  /* guarded remove: keep at least one row */
  const removeRow = (i: number) => {
    if (colors.length <= 1) return;
    onChange(colors.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col rounded p-2">
      {/* header */}
      <div className="flex gap-2 text-xs font-semibold text-gray-600 bg-white px-2 py-1 sticky top-0 z-10">
        <div className="w-1/2">Name</div>
        <div className="w-1/2">Color</div>
      </div>

      {/* list */}
      <div className="flex flex-col">
        {colors.map((c, idx) => {
          const canDelete = colors.length > 1;
          return (
            <div
              key={idx}
              className={`flex gap-2 items-center px-2 py-2 ${idx % 2 === 0 ? "bg-gray-50" : ""} hover:bg-gray-100`}
            >
              <input
                className="border px-2 py-1 rounded w-1/2"
                placeholder="e.g. Red"
                value={c.name}
                onChange={(e) => update(idx, "name", e.target.value)}
              />

              <input
                type="color"
                value={c.hex}
                onChange={(e) => update(idx, "hex", e.target.value)}
                className="w-1/2 h-8 p-0 border rounded"
              />

              <button
                type="button"
                title={
                  canDelete ? "Remove color" : "At least one color required"
                }
                disabled={!canDelete}
                onClick={() => removeRow(idx)}
                className={
                  canDelete
                    ? "text-red-600"
                    : "text-gray-400 cursor-not-allowed"
                }
              >
                <FiX />
              </button>
            </div>
          );
        })}
      </div>

      {/* add button */}
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-blue-600 flex justify-end items-center gap-1 text-sm hover:underline"
      >
        <FiPlus /> add More
      </button>
    </div>
  );
}
