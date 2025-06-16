// src/components/productattribute/OtherType.tsx
"use client";

import React from "react";
import { FiPlus, FiX } from "react-icons/fi";

/** --- public pair type --- */
export interface OtherPair {
  name: string;
  value: string;
}

/** --- props --- */
interface Props {
  pairs: OtherPair[];
  onChange: (next: OtherPair[]) => void;
}

export default function OtherType({ pairs, onChange }: Props) {
  const update = (i: number, field: keyof OtherPair, val: string) => {
    const next = [...pairs];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  const addRow = () => onChange([...pairs, { name: "", value: "" }]);

  const removeRow = (i: number) => {
    if (pairs.length <= 1) return;
    onChange(pairs.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col border rounded p-2">
      {/* header */}
      <div className="flex gap-2 text-xs font-semibold text-gray-600 bg-white px-2 py-1 sticky top-0 z-10">
        <div className="flex-1">Name</div>
        <div className="flex-1">Value</div>
        <div className="w-6" />
      </div>

      {/* list */}
      <div className="flex flex-col">
        {pairs.map((row, i) => (
          <div
            key={i}
            className={`flex gap-2 items-center px-2 py-2 ${
              i % 2 === 0 ? "bg-gray-50" : ""
            } hover:bg-gray-100`}
          >
            <input
              className="flex-1 border px-2 py-1 rounded"
              placeholder="e.g. Custom Name"
              value={row.name}
              onChange={(e) => update(i, "name", e.target.value)}
            />

            <input
              className="flex-1 border px-2 py-1 rounded"
              placeholder="e.g. Some value"
              value={row.value}
              onChange={(e) => update(i, "value", e.target.value)}
            />

            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={pairs.length <= 1}
              title={
                pairs.length <= 1
                  ? "At least one value is required"
                  : "Remove row"
              }
              className={`${
                pairs.length <= 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-600"
              }`}
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>

      {/* add row */}
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-blue-600 flex items-center gap-1 text-sm hover:underline"
      >
        <FiPlus /> add row
      </button>
    </div>
  );
}
