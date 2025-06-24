// src/app/dashboard/blog/articles/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ---------- types & constants ---------- */
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

/* ---------- component ---------- */
export default function ArticlesClientPage() {
  /* ── state ────────────────────────────────────────────────────────── */
  const [items, setItems] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [deleteTitle, setDeleteTitle] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /* ── fetch on mount ───────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  /* ── filter & paginate ────────────────────────────────────────────── */
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

  /* ── CRUD helpers ─────────────────────────────────────────────────── */
  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await fetchFromAPI<void>(
        `/dashboardadmin/blog/post/delete/${id}`,
        { method: "DELETE" }
      );
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
    const snapshot = items;
    setItems((prev) =>
      prev.map((p) => (p._id === id ? { ...p, vadmin: newStatus } : p))
    );
    try {
      await fetchFromAPI<void>(
        `/dashboardadmin/blog/post/update/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vadmin: newStatus }),
        }
      );
    } catch {
      setItems(snapshot);
      alert("Failed to update status");
    }
  };

  const openDelete = (id: string, title: string) => {
    setDeleteId(id);
    setDeleteTitle(title);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">All Posts</h1>
        <Link href="/dashboard/blog/articles/create">
          <button className="w-[250px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Post
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
            placeholder="Title"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr>
              <th className="w-1/8 py-2 text-center text-sm font-medium border-x-4">Ref</th>
              <th className="w-1/8 py-2 text-center text-sm font-medium border-x-4">Title</th>
              <th className="w-1/8 py-2 text-center text-sm font-medium border-x-4">Created At</th>
              <th className="w-1/8 py-2 text-center text-sm font-medium border-x-4">Created By</th>
              <th className="w-1/8 py-2 text-center text-sm font-medium border-x-4">Updated At</th>
              <th className="w-1/8 py-2 text-center text-sm font-medium border-x-4">Updated By</th>
              <th className="w-2/8 py-2 text-center text-sm font-medium border-x-4">Action</th>
            </tr>
          </thead>
        </table>

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
                    <td className="py-2 text-center font-semibold">{p.title}</td>
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
                    <td className="py-2 w-2/8">
                      <div className="flex justify-center items-center gap-2">
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
          name={deleteTitle}
          isLoading={isDeleting}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
