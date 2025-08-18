// src/app/dashboard/manage-stock/products/page.tsx

"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FaRegEdit, FaRegEye, FaTrashAlt} from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import {
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
  StockStatus,
  StatusPage,
  Vadmin,
} from "@/constants/product-options";
import { IoMdCreate } from "react-icons/io";

interface Product {
  _id: string;
  reference: string;
  name: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: Vadmin;
  stockStatus: StockStatus;
  statuspage: StatusPage;
}

const DEFAULT_PAGE_SIZE = 10;
const BREAKPOINT_QUERY = "(max-width: 1535px)";

/* ---------- Sélecteur stylé rendu dans un portail ---------- */
type StringUnion = string;
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
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const label = display ? display(value) : String(value);

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
      if (!btnRef.current) return;
      const target = e.target as Node;
      if (btnRef.current.contains(target)) return;
      const el = (target as HTMLElement)?.closest("[data-nice-select-root]");
      if (el) return;
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

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`min-w-[160px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer
                    bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100
                    focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className}`}
      >
        <span className="truncate">{label}</span>
        <FiChevronDown className="shrink-0" />
      </button>

      {open &&
        pos &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            data-nice-select-root
            className="fixed z-[1000]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="presentation"
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
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 cursor-pointer
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
          document.body,
        )}
    </>
  );
}

export default function ProductsClientPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT_QUERY);
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPageSize(e.matches ? 7 : DEFAULT_PAGE_SIZE);
      setCurrentPage(7);
    };
    setPageSize(mql.matches ? 7 : DEFAULT_PAGE_SIZE);
    mql.addEventListener("change", handleMediaChange);
    return () => mql.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { products } = await fetchFromAPI<{ products: Product[] }>(
          "/dashboardadmin/stock/products",
        );
        setProducts(products);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  async function updateField<K extends keyof Product>(id: string, key: K, value: Product[K]) {
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, [key]: value } : p)));
    try {
      await fetchFromAPI(`/dashboardadmin/stock/products/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      setProducts((prev) => [...prev]);
      alert(`Échec de mise à jour du champ ${String(key)}.`);
    }
  }

  async function deleteProduct(id: string) {
    await fetchFromAPI(`/dashboardadmin/stock/products/delete/${id}`, {
      method: "DELETE",
    });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  }

  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    await deleteProduct(id);
    setDeleteLoading(false);
    closeDelete();
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4">
      <div className="flex h-fit mx-auto md:w-full w-[80%] justify-between items-center">
        <h1 className="text-3xl font-bold uppercase">Produits</h1>

        {/* Desktop: text button / Mobile: icon-only */}
        <div className="flex items-center">
          <Link href="/dashboard/manage-stock/products/create" className="hidden md:block">
            <button className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer">
              Créer un produit
            </button>
          </Link>

          <Link href="/dashboard/manage-stock/products/create" className="md:hidden">
            <button
              aria-label="Créer un produit"
              className="ButtonSquare"
            >
              <IoMdCreate size={14} />
            </button>
          </Link>
        </div>
      </div>

      <div className="flex md:justify-between items-end gap-6 h-fit justify-center">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche :</label>
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Nom du produit"
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="flex flex-col">
        {/* ===== Desktop header (unchanged) ===== */}
        <table className="table-fixed w-full hidden md:table">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-2 text-sm font-medium text-center">Réf</th>
              <th className="py-2 text-sm font-medium text-center border-x-4">Nom</th>
              <th className="py-2 text-sm font-medium text-center border-x-4 max-2xl:hidden">
                Créé/MàJ par
              </th>
              <th className="py-2 text-sm font-medium text-center border-x-4 max-2xl:hidden">
                Créé/MàJ le
              </th>
              <th className="w-5/9 py-2 text-sm font-medium text-center border-x-4">Actions</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          {/* ===== Desktop table body (unchanged) ===== */}
          <table className="table-fixed w-full hidden md:table">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucun produit trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((p, i) => (
                  <tr key={p._id} className={i % 2 ? "bg-gray-100" : "bg-white"}>
                    <td className="py-2 text-center">{p.reference}</td>
                    <td className="py-2 text-center font-semibold truncate">{p.name}</td>
                    <td className="py-2 text-center max-2xl:hidden">
                      {p.updatedBy?.username || p.createdBy?.username || "—"}
                    </td>
                    <td className="py-2 text-center max-2xl:hidden">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 w-5/9">
                      <div className="flex justify-center items-center gap-2">
                        <NiceSelect<Vadmin>
                          value={p.vadmin}
                          options={ADMIN_OPTIONS as readonly Vadmin[]}
                          onChange={(v) => updateField(p._id, "vadmin", v)}
                          className="truncate"
                        />

                        <NiceSelect<StockStatus>
                          value={p.stockStatus}
                          options={STOCK_OPTIONS as readonly StockStatus[]}
                          onChange={(v) => updateField(p._id, "stockStatus", v)}
                          className="truncate"
                        />

                        <NiceSelect<StatusPage>
                          value={p.statuspage}
                          options={PAGE_OPTIONS as readonly StatusPage[]}
                          onChange={(v) => updateField(p._id, "statuspage", v)}
                          display={(v) => (v === "none" ? "Aucune" : v.replace("-", " "))}
                          className="truncate"
                        />

                        <Link href={`/dashboard/manage-stock/products/update/${p._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <Link href={`/dashboard/manage-stock/products/voir/${p._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <button onClick={() => openDelete(p._id, p.name)} className="ButtonSquare">
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* ===== Mobile cards ===== */}
          <div className="md:hidden">
            {displayed.length === 0 && !loading ? (
              <div className="py-6 text-center text-gray-600">Aucun produit trouvé.</div>
            ) : (
              <div className="space-y-3">
                {displayed.map((p, i) => (
                  <div
                    key={p._id}
                    className={`rounded-md border ${i % 2 ? "bg-gray-100" : "bg-white"} p-3 shadow-sm`}
                  >
                    {/* Header: name + actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight truncate">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Réf : {p.reference}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/dashboard/manage-stock/products/update/${p._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <Link href={`/dashboard/manage-stock/products/voir/${p._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(p._id, p.name)}
                          className="ButtonSquare"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                      <span>{p.updatedBy?.username || p.createdBy?.username || "—"}</span>
                      <span>{new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Controls */}
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <NiceSelect<Vadmin>
                        value={p.vadmin}
                        options={ADMIN_OPTIONS as readonly Vadmin[]}
                        onChange={(v) => updateField(p._id, "vadmin", v)}
                        className="w-full"
                      />
                      <NiceSelect<StockStatus>
                        value={p.stockStatus}
                        options={STOCK_OPTIONS as readonly StockStatus[]}
                        onChange={(v) => updateField(p._id, "stockStatus", v)}
                        className="w-full"
                      />
                      <NiceSelect<StatusPage>
                        value={p.statuspage}
                        options={PAGE_OPTIONS as readonly StatusPage[]}
                        onChange={(v) => updateField(p._id, "statuspage", v)}
                        display={(v) => (v === "none" ? "Aucune" : v.replace("-", " "))}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {isDeleteOpen && (
        <Popup
          id={deleteId}
          name={deleteName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
