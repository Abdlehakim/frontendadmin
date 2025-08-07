// src/components/DateFilter.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { DateRangePicker } from "react-date-range";
import type { RangeKeyDict } from "react-date-range";
import { FaCalendarAlt } from "react-icons/fa";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export type DateRange = { start: Date; end: Date };

interface Props {
  onChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

export default function DateFilter({ onChange, initialRange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rangeSel, setRangeSel] = useState<{
    key: "selection";
    startDate: Date;
    endDate: Date;
  }>({
    key: "selection",
    startDate: initialRange?.start ?? new Date(),
    endDate: initialRange?.end ?? new Date(),
  });

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = `${rangeSel.startDate.toLocaleDateString("fr-FR")} – ${rangeSel.endDate.toLocaleDateString("fr-FR")}`;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 text-sm hover:bg-gray-50"
      >
        <FaCalendarAlt />
        <span>{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2  border border-gray-300 shadow-lg">
          {/* add a custom wrapper class */}
          <div className="custom-range-picker">
            <DateRangePicker
              ranges={[rangeSel]}
              onChange={(r: RangeKeyDict) => {
                const { startDate, endDate } = r.selection;
                if (startDate && endDate) {
                  setRangeSel({ key: "selection", startDate, endDate });
                }
              }}
              months={1}
              direction="horizontal"
              showDateDisplay={false}
              inputRanges={[]} 
            />
          </div>

          <div className="flex justify-end gap-2 p-2">
            <button
              onClick={() => setOpen(false)}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const end = new Date(rangeSel.endDate);
                end.setHours(23, 59, 59, 999);
                onChange({ start: rangeSel.startDate, end });
                setOpen(false);
              }}
              className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-range-picker .rdrDefinedRangesWrapper {
          width: 8rem; /* adjust as needed */
          min-width: 6rem;
        }
      `}</style>
    </div>
  );
}
