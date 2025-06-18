// src/components/addproductsteps/StepAttributesDetails.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Dimension, { DimPair } from "@/components/productattribute/Dimension";
import Color, { ColorPair } from "@/components/productattribute/Color";
import OtherType, { OtherPair } from "@/components/productattribute/OtherType";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
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
  initialAttrs?: AttributePayload[];
  initialDetails?: ProductDetailPair[];
  ready?: boolean;
  onChange: (
    attrs: AttributePayload[],
    productDetails: ProductDetailPair[],
    fileMap: Map<string, File>
  ) => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const hasType = (d: AttributeDef, t: BaseType) =>
  Array.isArray(d.type) ? d.type.includes(t) : d.type === t;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function StepAttributesDetails({
  defs,
  initialAttrs = [],
  initialDetails = [],
  ready = true,
  onChange,
}: Props) {
  /* ---------- state ---------- */
  const initialised = useRef(false);
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const [dims, setDims] = useState<Record<string, DimPair[]>>({});
  const [colors, setColors] = useState<Record<string, ColorPair[]>>({});
  const [others, setOthers] = useState<Record<string, OtherPair[]>>({});
  const [details, setDetails] = useState<ProductDetailPair[]>([]);

  /* ---------- one-time init ---------- */
  useEffect(() => {
    if (!initialised.current && ready && defs.length) {
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

      if (initialAttrs.length) {
        setSelectedIds(initialAttrs.map((a) => a.attributeSelected));
        initialAttrs.forEach((a) => {
          const id = a.attributeSelected;
          if (typeof a.value === "string") txt[id] = a.value;
          else {
            const def = defs.find((d) => d._id === id)!;
            if (hasType(def, "dimension")) dms[id] = a.value as DimPair[];
            else if (hasType(def, "color")) cls[id] = a.value as ColorPair[];
            else if (hasType(def, "other type"))
              oth[id] = a.value as OtherPair[];
          }
        });
      }

      setText(txt);
      setDims(dms);
      setColors(cls);
      setOthers(oth);
      setDetails(initialDetails);
      initialised.current = true;
    }
  }, [ready, defs, initialAttrs, initialDetails]);

  /* ------------------------------------------------------------------ */
  /* file-map helpers                                                   */
  /* ------------------------------------------------------------------ */
  const putFile = useCallback(
    (field: string, file: File) =>
      setFileMap((prev) => {
        const map = new Map(prev);
        map.set(field, file);
        return map;
      }),
    []
  );

  const removeFilesForAttribute = useCallback((attrIdx: number) => {
    setFileMap((prev) => {
      const map = new Map<string, File>();
      prev.forEach((file, key) => {
        const m = key.match(/^attributeImages-(\d+)-/);
        if (!m || Number(m[1]) !== attrIdx) map.set(key, file);
      });
      return map;
    });
  }, []);

  const shiftFileKeys = useCallback((removedIdx: number) => {
    setFileMap((prev) => {
      const map = new Map<string, File>();
      prev.forEach((file, key) => {
        const m = key.match(/^attributeImages-(\d+)-(\d+)$/);
        if (!m) return map.set(key, file);
        const aIdx = Number(m[1]);
        const vIdx = m[2];
        if (aIdx === removedIdx) return;
        if (aIdx > removedIdx) map.set(`attributeImages-${aIdx - 1}-${vIdx}`, file);
        else map.set(key, file);
      });
      return map;
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /* outbound serialisation                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const payload: AttributePayload[] = selectedIds.map((id) => {
      const def = defs.find((d) => d._id === id)!;

      if (hasType(def, "dimension"))
        return { attributeSelected: id, attributeName: def.name, value: dims[id] || [] };

      if (hasType(def, "color"))
        return { attributeSelected: id, attributeName: def.name, value: colors[id] || [] };

      if (hasType(def, "other type"))
        return { attributeSelected: id, attributeName: def.name, value: others[id] || [] };

      return { attributeSelected: id, attributeName: def.name, value: text[id] || "" };
    });

    onChange(payload, details, fileMap);
  }, [selectedIds, text, dims, colors, others, details, fileMap, defs, onChange]);

  /* ------------------------------------------------------------------ */
  /* handlers                                                           */
  /* ------------------------------------------------------------------ */
  const removeAttribute = (id: string) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      removeFilesForAttribute(idx);
      shiftFileKeys(idx);
      return prev.filter((sid) => sid !== id);
    });
  };

  const addDetail = () =>
    setDetails((prev) => [...prev, { name: "", description: "" }]);

  const removeDetail = (i: number) =>
    setDetails((prev) => prev.filter((_, idx) => idx !== i));

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex gap-8 w-full">
      {/* ---------- Attributes ---------- */}
      <div className="flex flex-col gap-2 w-1/2 px-4">
        <legend className="text-2xl font-bold">Attributes</legend>

        <select
          className="w-full border px-2 py-1 rounded mb-4"
          defaultValue=""
          onChange={(e) => {
            const id = e.target.value;
            if (id && !selectedIds.includes(id))
              setSelectedIds((p) => [...p, id]);
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

          {selectedIds.map((id, attrIdx) => {
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
                    attributeIndex={attrIdx}
                    onChange={(list) => setDims((d) => ({ ...d, [id]: list }))}
                    onFileSelect={(file, field) => putFile(field, file)} 
                    onRowDelete={(field) =>
                      setFileMap((prev) => {
                        const m = new Map(prev);
                        m.delete(field);
                        return m;
                      })
                    }
                  />
                )}

                {hasType(def, "color") && (
                  <Color
                    colors={colors[id]}
                    attributeIndex={attrIdx}
                    onChange={(list) => setColors((c) => ({ ...c, [id]: list }))}
                    onFileSelect={(file, field) => putFile(field, file)} 
                    onRowDelete={(field) =>
                      setFileMap((prev) => {
                        const map = new Map(prev);
                        map.delete(field);
                        return map;
                      })
                    }
                  />
                )}

                {hasType(def, "other type") && (
                  <OtherType
                    pairs={others[id]}
                    attributeIndex={attrIdx}
                    onChange={(list) =>
                      setOthers((o) => ({ ...o, [id]: list }))
                    }
                    onFileSelect={(file, field) => putFile(field, file)} 
                    onRowDelete={(field) =>
                      setFileMap((prev) => {
                        const m = new Map(prev);
                        m.delete(field);
                        return m;
                      })
                    }
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

      {/* ---------- Product details ---------- */}
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
