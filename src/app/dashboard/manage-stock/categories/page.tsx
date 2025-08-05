// ───────────────────────────────────────────────────────────────
// src/app/manage-stock/categories/page.tsx
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
interface Category {
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

export default function CategoriesClientPage() {
  /* data */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /* ui */
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* delete-popup */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  /* fetch once */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { categories } = await fetchFromAPI<{ categories: Category[] }>(
          "/dashboardadmin/stock/categories"
        );
        setCategories(categories ?? []);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* filter + paging */
  const filtered = useMemo(
    () =>
      categories.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [categories, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  /* server delete */
  const deleteCategory = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/stock/categories/delete/${id}`, {
      method: "DELETE",
    });
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  /* popup helpers */
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteCategory(id);
    } catch {
      alert("Deletion failed.");
    }
    setIsDeleting(false);
    closeDelete();
  };

  /* status update */
  const updateStatus = async (
    id: string,
    newStatus: (typeof statusOptions)[number]
  ) => {
    setCategories((prev) =>
      prev.map((c) => (c._id === id ? { ...c, vadmin: newStatus } : c))
    );
    try {
      await fetchFromAPI(`/dashboardadmin/stock/categories/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vadmin: newStatus }),
      });
    } catch {
      alert("Failed to update status");
    }
  };

  /* ───────── render ───────── */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Categories</h1>
        <Link href="/dashboard/manage-stock/categories/create">
          <button className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer">
            Create New Category
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
        {/* static header */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-2 text-center border-x-4 w-1/8">Reference</th>
              <th className="py-2 text-center border-x-4 w-1/8">Name</th>
              <th className="py-2 text-center border-x-4 w-1/8">Created At</th>
              <th className="py-2 text-center border-x-4 w-1/8">Created By</th>
              <th className="py-2 text-center border-x-4 w-1/8">Updated At</th>
              <th className="py-2 text-center border-x-4 w-1/8">Updated By</th>
              <th className="py-2 text-center border-x-4 w-2/8">Action</th>
            </tr>
          </thead>
        </table>

        {/* scrollable body */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-600">
                    No categories found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((c, i) => (
                  <tr
                    key={c._id}
                    className={i % 2 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className="py-2 w-1/8 text-center">{c.reference}</td>
                    <td className="py-2 w-1/8 text-center font-semibold">{c.name}</td>
                    <td className="py-2 w-1/8 text-center">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 w-1/8 text-center">
                      {c.createdBy?.username ?? "—"}
                    </td>
                    <td className="py-2 w-1/8 text-center">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 w-1/8 text-center">
                      {c.updatedBy?.username ?? "—"}
                    </td>
                    <td className="py-2 w-2/8">
                      <div className="flex justify-center items-center gap-2">
                        <select
                          value={c.vadmin}
                          onChange={(e) =>
                            updateStatus(
                              c._id,
                              e.target.value as (typeof statusOptions)[number]
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
                          href={`/dashboard/manage-stock/categories/voir/${c._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>

                        <Link
                          href={`/dashboard/manage-stock/categories/update/${c._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>

                        <button
                          onClick={() => openDelete(c._id, c.name)}
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
          isLoading={isDeleting}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
