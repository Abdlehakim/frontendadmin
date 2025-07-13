/* ------------------------------------------------------------------
   src/app/dashboard/delivery-options/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaRegEdit, FaTrashAlt, FaRegCopy } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ---------- types ---------- */
interface DeliveryOption {
  _id: string;
  name: string;
  price: number;
  estimatedDays: number;
  isActive: boolean;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE     = 12;
const statusOptions = [true, false] as const;

export default function DeliveryOptionsPage() {
  /* data */
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);

  /* UI */
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* delete-popup */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId]         = useState("");
  const [deleteName, setDeleteName]     = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* fetch once */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { deliveryOptions } =
        await fetchFromAPI<{ deliveryOptions: DeliveryOption[] }>(
          "/dashboardadmin/delivery-options/all"
        );
      setOptions(deliveryOptions);
      setLoading(false);
    })();
  }, []);

  /* filter + paging */
  const filtered = useMemo(
    () =>
      options.filter((o) =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [options, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  /* ---------- helpers (updateStatus, deleteOption, etc.) ---------- */
  const updateStatus = async (
    id: string,
    newStatus: (typeof statusOptions)[number]
  ) => {
    setOptions((prev) =>
      prev.map((o) => (o._id === id ? { ...o, isActive: newStatus } : o))
    );
    try {
      await fetchFromAPI(`/dashboardadmin/delivery-options/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
    } catch {
      setOptions((prev) => [...prev]); // revert
      alert("Failed to update status");
    }
  };

  const deleteOption = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/delivery-options/delete/${id}`, {
      method: "DELETE",
    });
    setOptions((prev) => prev.filter((o) => o._id !== id));
  };

  const copyToClipboard = (text: string) =>
    navigator.clipboard.writeText(text).catch(() => alert("Copy failed."));

  /* popup helpers */
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete   = () => setIsDeleteOpen(false);
  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteOption(id);
    } catch {
      alert("Deletion failed.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  /* ---------- render ---------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Delivery Options</h1>
        <Link href="/dashboard/delivery-options/create">
          <button className="w-[180px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Add New Option
          </button>
        </Link>
      </div>

      {/* search */}
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

      {/* table header */}
      <table className="table-fixed w-full">
        <thead className="bg-primary text-white relative z-10">
          <tr>
            <th className="w-1/10 py-2 text-sm font-medium text-center">ID</th>
            <th className="w-1/10 py-2 text-sm font-medium text-center border-x-4">
              Name
            </th>
            <th className="w-1/10 py-2 text-sm font-medium text-center">
              Created&nbsp;By
            </th>
            <th className="w-1/10 py-2 text-sm font-medium text-center border-x-4">
              Created&nbsp;At
            </th>
            <th className="w-1/10 py-2 text-sm font-medium text-center">
              Updated&nbsp;By
            </th>
            <th className="w-1/10 py-2 text-sm font-medium text-center border-x-4">
              Updated&nbsp;At
            </th>
            <th className="w-3/10 py-2 text-sm font-medium text-center">
              Action
            </th>
          </tr>
        </thead>
      </table>

      {/* scrollable body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
              {/* show placeholder row if nothing to display */}
              {!loading && displayed.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-gray-500 italic"
                  >
                    No delivery options found.
                  </td>
                </tr>
              )}

              {displayed.map((o, i) => (
                <tr key={o._id} className={i % 2 ? "bg-gray-100" : "bg-white"}>
                  {/* id */}
                  <td className="w-1/10 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <span>{`${o._id.slice(0, 9)}...`}</span>
                      <button
                        onClick={() => copyToClipboard(o._id)}
                        className="hover:text-primary cursor-pointer"
                        title="Copy full ID"
                      >
                        <FaRegCopy size={14} />
                      </button>
                    </div>
                  </td>

                  {/* name */}
                  <td className="w-1/10 py-2 text-center font-semibold">
                    {o.name}
                  </td>

                  {/* created / updated meta */}
                  <td className="w-1/10 py-2 text-center">
                    {o.createdBy?.username || "—"}
                  </td>
                  <td className="w-1/10 py-2 text-center">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="w-1/10 py-2 text-center">
                    {o.updatedBy?.username || "—"}
                  </td>
                  <td className="w-1/10 py-2 text-center">
                    {new Date(o.updatedAt).toLocaleDateString()}
                  </td>

                  {/* action column */}
                  <td className="w-3/10 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <select
                        value={o.isActive.toString()}
                        onChange={(e) =>
                          updateStatus(
                            o._id,
                            e.target.value === "true"
                          )
                        }
                        className="border rounded px-2 py-1"
                      >
                        {statusOptions.map((s) => (
                          <option key={s.toString()} value={s.toString()}>
                            {s ? "active" : "inactive"}
                          </option>
                        ))}
                      </select>

                      <Link
                        href={`/dashboard/delivery-options/update/${o._id}`}
                      >
                        <button className="ButtonSquare">
                          <FaRegEdit size={14} />
                        </button>
                      </Link>
                      <button
                        onClick={() => openDelete(o._id, o.name)}
                        className="ButtonSquare"
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* pagination */}
      <div className="flex justify-center mt-6">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* delete popup */}
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
