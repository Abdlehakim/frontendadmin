// src/app/dashboardadmin/blog/postCategorie/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

interface PostCategorie {
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

export default function PostCategoriesClientPage() {
  const [items, setItems] = useState<PostCategorie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Delete popup state
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [deleteName, setDeleteName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch all post‐categories on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await fetchFromAPI<{ PostCategories: PostCategorie[] }>(
          "/dashboardadmin/blog/postcategorie"
        );
        setItems(result.PostCategories);
      } catch (err) {
        console.error("Failed to load post categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter + paginate
  const filtered = useMemo(
    () =>
      items.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [items, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  // Confirm delete from popup
  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await fetchFromAPI<void>(
        `/dashboardadmin/blog/postcategorie/delete/${id}`,
        { method: "DELETE" }
      );
      setItems((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete post category.");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  // Update status
  const updateStatus = async (
    id: string,
    newStatus: (typeof statusOptions)[number]
  ) => {
    setItems((prev) =>
      prev.map((c) => (c._id === id ? { ...c, vadmin: newStatus } : c))
    );
    try {
      await fetchFromAPI<void>(
        `/dashboardadmin/blog/postcategorie/update/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vadmin: newStatus }),
        }
      );
    } catch {
      setItems((prev) => [...prev]);
      alert("Failed to update status");
    }
  };

  // Delete popup handlers
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Post Categories</h1>
        <Link href="/dashboard/blog/postcategorie/create">
          <button className="w-[200px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Category
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label className="font-medium">Search:</label>
          <input
            type="text"
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

      {/* Table + spinner */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* header always visible */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr>
              <th className="w-1/8 py-2 text-sm font-medium text-center border-x-4">
                Ref
              </th>
              <th className="w-1/8 py-2 text-sm font-medium text-center border-x-4">
                Name
              </th>
              <th className="w-1/8 py-2 text-sm font-medium text-center border-x-4">
                Created At
              </th>
              <th className="w-1/8 py-2 text-sm font-medium text-center border-x-4">
                Created By
              </th>
              <th className="w-1/8 py-2 text-sm font-medium text-center border-x-4">
                Updated At
              </th>
              <th className="w-1/8 py-2 text-sm font-medium text-center border-x-4">
                Updated By
              </th>
              <th className="w-2/8 py-2 text-sm font-medium text-center border-x-4">
                Action
              </th>
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
                    No post categories found.
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
                    <td className="py-2 text-center">{c.reference}</td>
                    <td className="py-2 text-center font-semibold">
                      {c.name}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {c.createdBy?.username ?? "—"}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
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
                          href={`/dashboard/blog/postcategorie//voir/${c._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <Link
                          href={`/dashboard/blog/postcategorie/update/${c._id}`}
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

          {/* overlay covers only the body region */}
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

      {/* Delete popup */}
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
