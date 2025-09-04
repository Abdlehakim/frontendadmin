// ------------------------------------------------------------------
// src/app/dashboard/manage-client/factures/page.tsx
// ------------------------------------------------------------------
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEye } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import PaginationAdmin from "@/components/PaginationAdmin";
import DateFilter, { DateRange } from "@/components/DateFilter";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const fmtMoney = (amount: number, currency = "TND") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount ?? 0);

interface Facture {
  _id: string;
  ref: string;
  orderRef?: string;
  clientName: string;
  status: "Paid" | "Cancelled";
  issuedAt?: string;
  createdAt: string;
  currency?: string;
  grandTotalTTC: number;
}

const pageSize = 8;

const statusOptions = [
  { value: "Paid", label: "Payée" },
  { value: "Cancelled", label: "Annulée" },
] as const;

type StatusVal = (typeof statusOptions)[number]["value"];
type StringUnion = string;

/** ---------- inline NiceSelect (same pattern as orders) ---------- */
interface NiceSelectProps<T extends StringUnion> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  display?: (v: T) => string;
  className?: string;
}
function NiceSelect<T extends StringUnion>({
  value,
  options,
  onChange,
  display,
  className = "",
}: NiceSelectProps<T>) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    setPos({ top: b.bottom + 4, left: b.left, width: b.width });
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest("[data-nice-select-root]")) return;
      setOpen(false);
    };
    const onMove = () => updatePos();
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const label = display ? display(value) : String(value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`min-w-[150px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
                    bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100
                    focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <FiChevronDown className="shrink-0" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            data-nice-select-root
            className="fixed z-[1000]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div
              className="rounded-md border bg-white shadow-lg max-h-60 overflow-auto"
              role="listbox"
            >
              {options.map((opt) => {
                const isActive = opt === value;
                const text = display ? display(opt) : String(opt);
                return (
                  <button
                    key={String(opt)}
                    type="button"
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2
                      ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700"}
                      hover:bg-emerald-100 hover:text-emerald-800`}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border
                        ${isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}
                    >
                      <FiCheck size={12} />
                    </span>
                    <span className="truncate">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** ---------------------------- Page ---------------------------- */
export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const filtered = useMemo(
    () =>
      factures
        .filter((f) => !filterStatus || f.status === (filterStatus as Facture["status"]))
        .filter((f) => {
          const q = searchTerm.trim().toLowerCase();
          if (!q) return true;
          return (
            f.ref.toLowerCase().includes(q) ||
            (f.orderRef ?? "").toLowerCase().includes(q) ||
            f.clientName.toLowerCase().includes(q)
          );
        })
        .filter((f) => {
          if (!dateRange) return true;
          const d = new Date(f.issuedAt ?? f.createdAt);
          return d >= dateRange.start && d <= dateRange.end;
        }),
    [factures, filterStatus, searchTerm, dateRange]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => {
    (async () => {
      try {
        const { factures } = await fetchFromAPI<{ factures: Facture[] }>(
          "/dashboardadmin/factures"
        );
        setFactures(factures ?? []);
      } catch (err) {
        console.error("Fetch factures error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateStatus = async (id: string, status: StatusVal) => {
    try {
      await fetchFromAPI(`/dashboardadmin/factures/updateStatus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setFactures((prev) =>
        prev.map((f) => (f._id === id ? { ...f, status } as Facture : f))
      );
    } catch (err) {
      console.error("Update facture status error ▶", err);
      alert("Échec de la mise à jour du statut de la facture.");
    }
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Factures</h1>
        {/* Les factures sont générées à partir des commandes */}
      </div>

      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="searchFacture" className="font-medium">
            Rechercher :
          </label>
          <input
            id="searchFacture"
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="Réf, commande ou client"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">Filtrer par date :</label>
            <DateFilter
              onChange={(range) => {
                setDateRange(range);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="font-medium">
              Filtrer par statut :
            </label>
            <select
              id="statusFilter"
              className="border border-gray-300 rounded px-2 py-1"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center">Date</th>
              <th className="px-4 py-2 text-center">Référence</th>
              <th className="px-4 py-2 text-center">Commande</th>
              <th className="px-4 py-2 text-center">Client</th>
              <th className="px-4 py-2 text-center">Total TTC</th>
              <th className="px-4 py-2 text-center">Statut</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-600">
                    Aucune facture trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((f) => (
                  <tr key={f._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center">{fmtDate(f.issuedAt ?? f.createdAt)}</td>
                    <td className="px-4 text-center truncate font-semibold">{f.ref}</td>
                    <td className="px-4 text-center truncate">{f.orderRef ?? "—"}</td>
                    <td className="px-4 text-center truncate">{f.clientName}</td>
                    <td className="px-4 text-center">
                      {fmtMoney(f.grandTotalTTC, f.currency ?? "TND")}
                    </td>
                    <td className="px-4 text-center">
                      <NiceSelect<StatusVal>
                        value={f.status}
                        options={statusOptions.map((s) => s.value)}
                        onChange={(v) => updateStatus(f._id, v)}
                        display={(v) => statusOptions.find((s) => s.value === v)?.label ?? v}
                        className="mx-auto"
                      />
                    </td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link href={`/dashboard/manage-client/factures/voir/${f._id}`}>
                          <button className="ButtonSquare" aria-label="Voir la facture">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
