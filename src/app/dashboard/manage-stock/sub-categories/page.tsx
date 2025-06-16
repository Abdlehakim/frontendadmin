// ───────────────────────────────────────────────────────────────
// src/app/manage-stock/sub-categories/page.tsx
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
interface ParentCategory {
  _id: string;
  name: string;
}
interface SubCategory {
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

export default function SubCategoriesClientPage() {
  /* data */
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  /* ui */
  const [filterCat, setFilterCat] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* delete-popup */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false); // NEW

  /* fetch parent categories */
  useEffect(() => {
    (async () => {
      try {
        const { categories } =
          await fetchFromAPI<{ categories: ParentCategory[] }>(
            "/dashboardadmin/stock/categories",
          );
        setParentCategories(categories);
      } catch (err) {
        console.error("Failed to load parent categories:", err);
      }
    })();
  }, []);

  /* fetch sub-categories (depends on filter) */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url = filterCat
          ? `/dashboardadmin/stock/subcategories?categorie=${filterCat}`
          : "/dashboardadmin/stock/subcategories";
        const { subCategories } =
          await fetchFromAPI<{ subCategories: SubCategory[] }>(url);
        setSubCategories(subCategories);
      } catch (err) {
        console.error("Failed to load sub-categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [filterCat]);

  /* filter + paging */
  const filtered = useMemo(
    () =>
      subCategories.filter((sc) =>
        sc.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [subCategories, searchTerm],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  /* server actions */
  const deleteSubCategory = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/stock/subcategories/delete/${id}`, {
      method: "DELETE",
    });
    setSubCategories((prev) => prev.filter((sc) => sc._id !== id));
  };

  const updateStatus = async (
    id: string,
    newStatus: (typeof statusOptions)[number],
  ) => {
    const old = subCategories.find((sc) => sc._id === id)?.vadmin;
    setSubCategories((prev) =>
      prev.map((sc) => (sc._id === id ? { ...sc, vadmin: newStatus } : sc)),
    );
    try {
      await fetchFromAPI(`/dashboardadmin/stock/subcategories/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vadmin: newStatus }),
      });
    } catch {
      // rollback
      setSubCategories((prev) =>
        prev.map((sc) => (sc._id === id ? { ...sc, vadmin: old! } : sc)),
      );
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

  // NOW complies with required signature
  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteSubCategory(id);
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
        <h1 className="text-3xl font-bold uppercase">Sous-Categories</h1>
        <Link href="/dashboard/manage-stock/sub-categories/create">
          <button className="w-[250px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Sub-Category
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        {/* Parent category */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Parent Category:</label>
          <select
            value={filterCat}
            onChange={(e) => {
              setFilterCat(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All</option>
            {parentCategories.map((pc) => (
              <option key={pc._id} value={pc._id}>
                {pc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Search:</label>
          <input
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="Sub-category name"
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
          <thead className="bg-primary text-white relative z-10">
            <tr>
              <th className="w-1/9 py-2 text-sm font-medium text-center">Ref</th>
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
                    No sub-categories found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((sc, i) => (
                  <tr
                    key={sc._id}
                    className={i % 2 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className="py-2 text-center">{sc.reference}</td>
                    <td className="py-2 text-center font-semibold">{sc.name}</td>
                    <td className="py-2 text-center">
                      {sc.createdBy?.username || "—"}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(sc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {sc.updatedBy?.username || "—"}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(sc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <div className="flex justify-center items-center gap-2">
                        <select
                          value={sc.vadmin}
                          onChange={(e) =>
                            updateStatus(
                              sc._id,
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
                          href={`/dashboard/manage-stock/sub-categories/voir/${sc._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <Link
                          href={`/dashboard/manage-stock/sub-categories/update/${sc._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(sc._id, sc.name)}
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
          Delete={confirmDelete}   /* signature ok */
        />
      )}
    </div>
  );
}
