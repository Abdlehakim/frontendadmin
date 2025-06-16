// src/components/productattribute/Dimension.tsx
"use client";

import React from "react";
import { FiPlus, FiX } from "react-icons/fi";

/* --- public pair type --- */
export interface DimPair {
  name: string;
  value: string;
}

/* --- preset names --- */
const PRESET_NAMES = [
  "height",
  "width",
  "length",
  "depth",
  "thickness",
  "diameter",
  "volume",
  "weight",
] as const;

type PresetName = (typeof PRESET_NAMES)[number];
const isPreset = (v: string): v is PresetName =>
  (PRESET_NAMES as readonly string[]).includes(v);

const CUSTOM_TOKEN = "__custom__";

/* --- props --- */
interface Props {
  pairs: DimPair[];
  onChange: (next: DimPair[]) => void;
}

/* ======================================================================= */
export default function Dimension({ pairs, onChange }: Props) {
  /* update helper */
  const update = (i: number, field: keyof DimPair, val: string) => {
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

      {/* list without scroll */}
      <div className="flex flex-col">
        {pairs.map((row, i) => {
          const dropdownMode = row.name === "" || isPreset(row.name);
          const isCustom = row.name === CUSTOM_TOKEN;
          return (
            <div
              key={i}
              className={`flex gap-2 items-center px-2 py-2 ${
                i % 2 === 0 ? 'bg-gray-50' : ''
              } hover:bg-gray-100`}
            >
              <div className="flex-1">
                {dropdownMode ? (
                  <select
                    className="w-full border px-2 py-1 rounded"
                    value={isPreset(row.name) ? row.name : ""}
                    onChange={(e) =>
                      update(
                        i,
                        "name",
                        e.target.value === CUSTOM_TOKEN
                          ? CUSTOM_TOKEN
                          : e.target.value
                      )
                    }
                  >
                    <option value="">-- choose --</option>
                    {PRESET_NAMES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                    <option value={CUSTOM_TOKEN}>Other …</option>
                  </select>
                ) : (
                  <input
                    className="w-full border px-2 py-1 rounded"
                    placeholder="custom name"
                    value={isCustom ? "" : row.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                  />
                )}
              </div>

              <input
                className="flex-1 border px-2 py-1 rounded"
                placeholder="e.g. 15 cm"
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
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600'
                }`}
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
        <FiPlus /> add row
      </button>
    </div>
  );
}
