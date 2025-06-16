// ───────────────────────────────────────────────────────────────
// src/app/manage-stock/product-attribute/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ───────── types ───────── */
interface ProductAttribute {
  _id: string;
  name: string;
  type: string | string[];
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 12;

export default function ProductAttributesClientPage() {
  /* data */
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  /* ui */
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* delete-popup */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false); // NEW

  /* fetch once */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { productAttributes } =
          await fetchFromAPI<{ productAttributes: ProductAttribute[] }>(
            "/dashboardadmin/stock/productattribute",
          );
        setProductAttributes(productAttributes ?? []);
      } catch (err) {
        console.error("Failed to load product attributes:", err);
        setProductAttributes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* filter + paging */
  const filtered = useMemo(
    () =>
      productAttributes.filter((pa) =>
        pa.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [productAttributes, searchTerm],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  /* server delete */
  const deleteAttribute = async (id: string) => {
    await fetchFromAPI(
      `/dashboardadmin/stock/productattribute/delete/${id}`,
      { method: "DELETE" },
    );
    setProductAttributes((prev) => prev.filter((pa) => pa._id !== id));
  };

  /* popup helpers */
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  // NOW returns Promise<void>
  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteAttribute(id);
    } catch {
      alert("Deletion failed.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  /* ───────── render ───────── */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Product Attributes</h1>
        <Link href="/dashboard/manage-stock/product-attributes/create">
          <button className="w-[200px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Attribute
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label className="font-medium">Search:</label>
          <input
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="Name"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-2 text-center border-x-4">Name</th>
              <th className="py-2 text-center border-x-4">Type</th>
              <th className="py-2 text-center border-x-4">Created At</th>
              <th className="py-2 text-center border-x-4">Created By</th>
              <th className="py-2 text-center border-x-4">Updated At</th>
              <th className="py-2 text-center border-x-4">Updated By</th>
              <th className="py-2 text-center border-x-4">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-600">
                    No attributes found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((pa, i) => (
                  <tr key={pa._id} className={i % 2 ? "bg-gray-100" : "bg-white"}>
                    <td className="py-2 text-center font-semibold">{pa.name}</td>
                    <td className="py-2 text-center">
                      {Array.isArray(pa.type) ? pa.type.join(", ") : pa.type}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(pa.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {pa.createdBy?.username ?? "—"}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(pa.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {pa.updatedBy?.username ?? "—"}
                    </td>
                    <td className="py-2">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          href={`/dashboard/manage-stock/product-attributes/voir/${pa._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <Link
                          href={`/dashboard/manage-stock/product-attributes/update/${pa._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(pa._id, pa.name)}
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
      <div className="flex justify-center mt-4">
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
