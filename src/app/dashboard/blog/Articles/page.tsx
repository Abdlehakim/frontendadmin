// src/app/dashboard/blog/articles/BlogsClientPage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import CreateArticleModal from "@/components/blog/articles/CreateArticleModal";
import Popup from "@/components/Popup/DeletePopup";

/* ----------------------------------------------------------------------- */
/* Types & constants                                                       */
/* ----------------------------------------------------------------------- */
interface BlogArticle {
  _id: string;
  title: string;
  reference: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: "approve" | "not-approve";
}

const PAGE_SIZE = 12;
const statusOptions = ["approve", "not-approve"] as const;

/* ----------------------------------------------------------------------- */
/* Component                                                               */
/* ----------------------------------------------------------------------- */
export default function BlogsClientPage() {
  /* ──────────────────────────────────────────────────────────────────── */
  /* State                                                               */
  /* ──────────────────────────────────────────────────────────────────── */
  const [items, setItems] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteTitle, setDeleteTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [showModal, setShowModal] = useState(false);

  /* ──────────────────────────────────────────────────────────────────── */
  /* Fetch all posts (articles)                                          */
  /* ──────────────────────────────────────────────────────────────────── */
  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetchFromAPI<{ posts: BlogArticle[] }>(
        "/dashboardadmin/blog/post"
      );
      setItems(res.posts);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  /* ──────────────────────────────────────────────────────────────────── */
  /* Filter & paginate                                                   */
  /* ──────────────────────────────────────────────────────────────────── */
  const filtered = useMemo(
    () =>
      items.filter((p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [items, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  /* ──────────────────────────────────────────────────────────────────── */
  /* CRUD helpers                                                        */
  /* ──────────────────────────────────────────────────────────────────── */
  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await fetchFromAPI<void>(`/dashboardadmin/blog/post/delete/${id}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete post.");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const updateStatus = async (
    id: string,
    newStatus: (typeof statusOptions)[number]
  ) => {
    const previous = items;
    setItems((prev) =>
      prev.map((p) => (p._id === id ? { ...p, vadmin: newStatus } : p))
    );
    try {
      await fetchFromAPI<void>(`/dashboardadmin/blog/post/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vadmin: newStatus }),
      });
    } catch {
      setItems(previous); // rollback
      alert("Failed to update status");
    }
  };

  /* ──────────────────────────────────────────────────────────────────── */
  /* Delete popup                                                        */
  /* ──────────────────────────────────────────────────────────────────── */
  const openDelete = (id: string, title: string) => {
    setDeleteId(id);
    setDeleteTitle(title);
    setIsDeleteOpen(true);
  };

  /* ──────────────────────────────────────────────────────────────────── */
  /* Modal success → reload list                                         */
  /* ──────────────────────────────────────────────────────────────────── */
  const handleSuccess = async () => {
    setShowModal(false);
    setCurrentPage(1);
    setSearchTerm("");
    await loadArticles();
  };

  /* --------------------------------------------------------------------- */
  /* Render                                                                */
  /* --------------------------------------------------------------------- */
  return (
    <div className="mx-auto flex h-full w-[95%] flex-col gap-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold uppercase">All Posts</h1>
        <button
          onClick={() => setShowModal(true)}
          className="h-10 w-48 rounded bg-tertiary text-white hover:opacity-90"
        >
          Create New Post
        </button>
      </div>

      {/* Search */}
      <div className="flex h-[70px] items-end justify-between gap-6">
        <div className="flex items-center gap-2">
          <label className="font-medium">Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 px-2 py-1"
            placeholder="Title"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="flex-1 flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="relative z-10 bg-primary text-white">
            <tr>
              <th className="w-1/8 border-x-4 py-2 text-center text-sm font-medium">
                Ref
              </th>
              <th className="w-1/8 border-x-4 py-2 text-center text-sm font-medium">
                Title
              </th>
              <th className="w-1/8 border-x-4 py-2 text-center text-sm font-medium">
                Created At
              </th>
              <th className="w-1/8 border-x-4 py-2 text-center text-sm font-medium">
                Created By
              </th>
              <th className="w-1/8 border-x-4 py-2 text-center text-sm font-medium">
                Updated At
              </th>
              <th className="w-1/8 border-x-4 py-2 text-center text-sm font-medium">
                Updated By
              </th>
              <th className="w-2/8 border-x-4 py-2 text-center text-sm font-medium">
                Action
              </th>
            </tr>
          </thead>
        </table>

        {/* Scrollable body */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-600">
                    No posts found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((p, i) => (
                  <tr key={p._id} className={i % 2 ? "bg-gray-100" : "bg-white"}>
                    <td className="py-2 text-center">{p.reference}</td>
                    <td className="py-2 text-center font-semibold">
                      {p.title}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {p.createdBy?.username ?? "—"}
                    </td>
                    <td className="py-2 text-center">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {p.updatedBy?.username ?? "—"}
                    </td>
                    <td className="w-2/8 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <select
                          value={p.vadmin}
                          onChange={(e) =>
                            updateStatus(
                              p._id,
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

                        <Link href={`/dashboard/blog/articles/voir/${p._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>

                        <Link href={`/dashboard/blog/articles/update/${p._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>

                        <button
                          onClick={() => openDelete(p._id, p.title)}
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
              <FaSpinner className="text-3xl animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
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
          name={deleteTitle}
          isLoading={isDeleting}
          handleClosePopup={() => setIsDeleteOpen(false)}
          Delete={confirmDelete}
        />
      )}

      {/* Create modal */}
      {showModal && (
        <CreateArticleModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
