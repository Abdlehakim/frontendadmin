"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
} from "react";
import Link from "next/link";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
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

/* ───────── types ───────── */
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

export default function ProductsClientPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // dynamic page size based on screen width
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // delete-popup state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ───────── handle responsive page size ───────── */
  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT_QUERY);
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPageSize(e.matches ? 7 : DEFAULT_PAGE_SIZE);
      setCurrentPage(7);
    };

    // initial check
    setPageSize(mql.matches ? 7 : DEFAULT_PAGE_SIZE);

    // listen for changes
    mql.addEventListener("change", handleMediaChange);
    return () => mql.removeEventListener("change", handleMediaChange);
  }, []);

  /* ───────── fetch products ───────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { products } = await fetchFromAPI<{ products: Product[] }>(
          "/dashboardadmin/stock/products"
        );
        setProducts(products);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────── search + pagination ───────── */
  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [products, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  /* ───────── single-field update ───────── */
  async function updateField<K extends keyof Product>(
    id: string,
    key: K,
    value: Product[K]
  ) {
    setProducts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [key]: value } : p))
    );
    try {
      await fetchFromAPI(`/dashboardadmin/stock/products/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      setProducts((prev) => [...prev]); // revert on error
      alert(`Failed to update ${key}`);
    }
  }

  /* ───────── delete helpers ───────── */
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

  /* ───────── render ───────── */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Products</h1>
        <Link href="/dashboard/manage-stock/products/create">
          <button className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer">
            Create New Product
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label className="font-medium">Search:</label>
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Product name"
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Table wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-2 text-sm font-medium text-center">Ref</th>
              <th className="py-2 text-sm font-medium text-center border-x-4">
                Name
              </th>
              <th className="py-2 text-sm font-medium text-center">
                Cre/updt By
              </th>
              <th className="py-2 text-sm font-medium text-center border-x-4 max-2xl:hidden">
                Cre/updt At
              </th>
              <th className="w-5/9 py-2 text-sm font-medium text-center border-x-4">
                Actions
              </th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    No products found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((p, i) => (
                  <tr
                    key={p._id}
                    className={i % 2 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className="py-2 text-center">{p.reference}</td>
                    <td className="py-2 text-center font-semibold truncate">
                      {p.name}
                    </td>
                    <td className="py-2 text-center">
                      {p.updatedBy?.username || p.createdBy?.username || "—"}
                    </td>
                    <td className="py-2 text-center max-2xl:hidden">
                      {new Date(
                        p.updatedAt || p.createdAt
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-2 w-5/9">
                      <div className="flex justify-center items-center gap-2">
                        {/* Vadmin */}
                        <select
                          value={p.vadmin}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            updateField(
                              p._id,
                              "vadmin",
                              e.target.value as Product["vadmin"]
                            )
                          }
                          className="ButtonRectangle"
                        >
                          {ADMIN_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {/* Stock Status */}
                        <select
                          value={p.stockStatus}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            updateField(
                              p._id,
                              "stockStatus",
                              e.target.value as Product["stockStatus"]
                            )
                          }
                          className="ButtonRectangle truncate"
                        >
                          {STOCK_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {/* Placement */}
                        <select
                          value={p.statuspage}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            updateField(
                              p._id,
                              "statuspage",
                              e.target.value as Product["statuspage"]
                            )
                          }
                          className="ButtonRectangle truncate"
                        >
                          {PAGE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === "none" ? "None" : opt.replace("-", " ")}
                            </option>
                          ))}
                        </select>

                        <Link
                          href={`/dashboard/manage-stock/products/update/${p._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <Link
                          href={`/dashboard/manage-stock/products/voir/${p._id}`}
                        >
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
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Delete Popup */}
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
