// src/components/addproductsteps/StepAttributesDetails.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Dimension, { DimPair } from "@/components/productattribute/Dimension";
import Color, { ColorPair } from "@/components/productattribute/Color";
import OtherType, { OtherPair } from "@/components/productattribute/OtherType";

export type BaseType = "dimension" | "color" | "other type";

export interface AttributeDef {
  _id: string;
  name: string;
  type: BaseType | BaseType[];
}

export interface AttributePayload {
  attributeSelected: string;
  attributeName: string;
  value: string | DimPair[] | ColorPair[] | OtherPair[];
}

export interface ProductDetailPair {
  name: string;
  description?: string;
}

interface Props {
  defs: AttributeDef[];
  initialAttrs?: AttributePayload[];             // existing on edit
  initialDetails?: ProductDetailPair[];           // existing on edit
  /** 
   * Only start initializing once parent is “ready” (create: always true; 
   * update: pass in `ready = !loading` from your page component) 
   **/
  ready?: boolean;
  onChange: (attrs: AttributePayload[], productDetails: ProductDetailPair[]) => void;
}

const hasType = (a: AttributeDef, t: BaseType) =>
  Array.isArray(a.type) ? a.type.includes(t) : a.type === t;

export default function StepAttributesDetails({
  defs,
  initialAttrs = [],
  initialDetails = [],
  ready = true,
  onChange,
}: Props) {
  const initialized = useRef(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const [dims, setDims] = useState<Record<string, DimPair[]>>({});
  const [colors, setColors] = useState<Record<string, ColorPair[]>>({});
  const [others, setOthers] = useState<Record<string, OtherPair[]>>({});
  const [details, setDetails] = useState<ProductDetailPair[]>([]);

  // ─── Initial hydration ───
  useEffect(() => {
    if (!initialized.current && ready && defs.length) {
      // 1) Build default blank state for every def
      const txt: Record<string, string> = {};
      const dms: Record<string, DimPair[]> = {};
      const cls: Record<string, ColorPair[]> = {};
      const oth: Record<string, OtherPair[]> = {};

      defs.forEach((def) => {
        txt[def._id] = "";
        if (hasType(def, "dimension")) dms[def._id] = [{ name: "", value: "" }];
        if (hasType(def, "color")) cls[def._id] = [{ name: "", hex: "#000000" }];
        if (hasType(def, "other type")) oth[def._id] = [{ name: "", value: "" }];
      });

      // 2) If we're editing, override with the existing values
      if (initialAttrs.length) {
        setSelectedIds(initialAttrs.map((a) => a.attributeSelected));
        initialAttrs.forEach((a) => {
          const id = a.attributeSelected;
          if (typeof a.value === "string") {
            txt[id] = a.value;
          } else {
            const def = defs.find((d) => d._id === id)!;
            if (hasType(def, "dimension")) dms[id] = a.value as DimPair[];
            else if (hasType(def, "color")) cls[id] = a.value as ColorPair[];
            else if (hasType(def, "other type")) oth[id] = a.value as OtherPair[];
          }
        });
      }

      // 3) Set everything in one batch
      setText(txt);
      setDims(dms);
      setColors(cls);
      setOthers(oth);
      setDetails(initialDetails);
      initialized.current = true;
    }
  }, [ready, defs, initialAttrs, initialDetails]);

  // ─── Notify parent on *any* change ───
  useEffect(() => {
    const payload: AttributePayload[] = selectedIds.map((id) => {
      const def = defs.find((d) => d._id === id)!;
      if (hasType(def, "dimension")) {
        return { attributeSelected: id, attributeName: def.name, value: dims[id] || [] };
      }
      if (hasType(def, "color")) {
        return { attributeSelected: id, attributeName: def.name, value: colors[id] || [] };
      }
      if (hasType(def, "other type")) {
        return { attributeSelected: id, attributeName: def.name, value: others[id] || [] };
      }
      return { attributeSelected: id, attributeName: def.name, value: text[id] || "" };
    });
    onChange(payload, details);
  }, [selectedIds, text, dims, colors, others, details, defs, onChange]);

  // ─── UI handlers ───
  const removeAttribute = (id: string) =>
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  const addDetail = () =>
    setDetails((prev) => [...prev, { name: "", description: "" }]);
  const removeDetail = (i: number) =>
    setDetails((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="flex gap-8 w-full">
      {/* Attributes */}
      <div className="flex flex-col gap-2 w-1/2 px-4">
        <legend className="text-2xl font-bold">Attributes</legend>
        <select
          className="w-full border px-2 py-1 rounded mb-4"
          defaultValue=""
          onChange={(e) => {
            const id = e.target.value;
            if (id && !selectedIds.includes(id)) {
              setSelectedIds((p) => [...p, id]);
            }
            e.target.value = "";
          }}
        >
          <option value="">-- choose attribute --</option>
          {defs
            .filter((d) => !selectedIds.includes(d._id))
            .map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
        </select>

        <div className="space-y-6">
          {selectedIds.length === 0 && (
            <p className="text-sm text-gray-500">No attributes selected.</p>
          )}
          {selectedIds.map((id) => {
            const def = defs.find((d) => d._id === id)!;
            return (
              <div key={id} className="border rounded p-4 space-y-2">
                <div className="flex h-16 justify-between items-start">
                  <h4 className="font-semibold">{def.name}</h4>
                  <button
                    type="button"
                    onClick={() => removeAttribute(id)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>

                {hasType(def, "dimension") && (
                  <Dimension
                    pairs={dims[id]}
                    onChange={(list) => setDims((d) => ({ ...d, [id]: list }))}
                  />
                )}
                {hasType(def, "color") && (
                  <Color
                    colors={colors[id]}
                    onChange={(list) => setColors((c) => ({ ...c, [id]: list }))}
                  />
                )}
                {hasType(def, "other type") && (
                  <OtherType
                    pairs={others[id]}
                    onChange={(list) => setOthers((o) => ({ ...o, [id]: list }))}
                  />
                )}
                {!hasType(def, "dimension") &&
                  !hasType(def, "color") &&
                  !hasType(def, "other type") && (
                    <input
                      className="w-full border px-2 py-1 rounded"
                      placeholder={`Enter ${def.name}`}
                      value={text[id] || ""}
                      onChange={(e) =>
                        setText((t) => ({ ...t, [id]: e.target.value }))
                      }
                    />
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col gap-2 w-1/2 px-4">
        <legend className="text-2xl font-bold">Product Details</legend>
        <div className="space-y-4">
          {details.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 border px-2 py-1 rounded"
                placeholder="Detail name"
                value={d.name}
                onChange={(e) => {
                  const copy = [...details];
                  copy[i].name = e.target.value;
                  setDetails(copy);
                }}
              />
              <input
                className="flex-1 border px-2 py-1 rounded"
                placeholder="Detail description"
                value={d.description}
                onChange={(e) => {
                  const copy = [...details];
                  copy[i].description = e.target.value;
                  setDetails(copy);
                }}
              />
              <button
                type="button"
                onClick={() => removeDetail(i)}
                className="text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addDetail}
          className="mt-2 text-blue-600 flex justify-end items-center gap-1 text-sm hover:underline"
        >
          + Add More
        </button>
      </div>
    </div>
);
}
