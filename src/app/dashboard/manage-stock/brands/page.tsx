// ───────────────────────────────────────────────────────────────
// src/app/manage-stock/brands/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaRegEdit, FaTrashAlt, FaRegEye } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ───────── types ───────── */
interface Brand {
  _id: string;
  reference: string;
  name: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: "approve" | "not-approve";
}

const PAGE_SIZE = 12;
const statusOptions = ["approve", "not-approve"] as const;

export default function BrandsClientPage() {
  /* data */
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  /* ui */
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* delete popup */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false); // NEW

  /* fetch once */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { brands: data } = await fetchFromAPI<{ brands: Brand[] }>(
          "/dashboardadmin/stock/brands",
        );
        setBrands(data);
      } catch (err) {
        console.error("Failed to load brands:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* filtering + paging */
  const filtered = useMemo(
    () =>
      brands.filter((b) =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [brands, searchTerm],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  /* API actions */
  const deleteBrand = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/stock/brands/delete/${id}`, {
      method: "DELETE",
    });
    setBrands((prev) => prev.filter((b) => b._id !== id));
  };

  const updateStatus = async (
    id: string,
    newStatus: (typeof statusOptions)[number],
  ) => {
    setBrands((prev) =>
      prev.map((b) => (b._id === id ? { ...b, vadmin: newStatus } : b)),
    );
    try {
      await fetchFromAPI(`/dashboardadmin/stock/brands/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vadmin: newStatus }),
      });
    } catch {
      setBrands((prev) => [...prev]); // revert optimistic
      alert("Failed to update status");
    }
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
      await deleteBrand(id);
    } catch {
      alert("Failed to delete brand");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  /* ───────── render ───────── */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Brands</h1>
        <Link href="/dashboard/manage-stock/brands/create">
          <button className="w-[180px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Brand
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
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="Name"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr>
              <th className="w-1/9 py-2 text-sm font-medium text-center">
                Ref
              </th>
              <th className="w-1/9 py-2 text-sm font-medium text-center border-x-4">
                Name
              </th>
              <th className="w-1/9 py-2 text-sm font-medium text-center">
                Created By
              </th>
              <th className="w-1/9 py-2 text-sm font-medium text-center border-x-4">
                Created At
              </th>
              <th className="w-1/9 py-2 text-sm font-medium text-center">
                Updated By
              </th>
              <th className="w-1/9 py-2 text-sm font-medium text-center border-x-4">
                Updated At
              </th>
              <th className="w-2/9 py-2 text-sm font-medium text-center">
                Action
              </th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-600">
                    No brands found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((b, i) => (
                  <tr
                    key={b._id}
                    className={i % 2 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className="py-2 text-center">{b.reference}</td>
                    <td className="py-2 text-center font-semibold">
                      {b.name}
                    </td>
                    <td className="py-2 text-center">
                      {b.createdBy?.username || "—"}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {b.updatedBy?.username || "—"}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(b.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <div className="flex justify-center items-center gap-2">
                        <select
                          value={b.vadmin}
                          onChange={(e) =>
                            updateStatus(
                              b._id,
                              e.target.value as (typeof statusOptions)[number],
                            )
                          }
                          className="ButtonRectangle"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <Link
                          href={`/dashboard/manage-stock/brands/update/${b._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <Link
                          href={`/dashboard/manage-stock/brands/voir/${b._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(b._id, b.name)}
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
          Delete={confirmDelete}   // matches expected signature
        />
      )}
    </div>
  );
}
