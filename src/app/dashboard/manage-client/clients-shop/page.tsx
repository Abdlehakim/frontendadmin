// ───────────────────────────────────────────────────────────────
// src/app/dashboard/manage-client/clients-shop/page.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ───────── types ───────── */
interface ClientShop {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

const pageSize = 12;

export default function ClientsShopPage() {
  const [clients, setClients]       = useState<ClientShop[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]       = useState(true);

  /* delete‑popup state */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState("");
  const [deleteClientName, setDeleteClientName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ───────── filters + paging ───────── */
  const filteredClients = useMemo(
    () =>
      clients.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [clients, searchTerm],
  );

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));

  const displayedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage]);

  /* ───────── fetch data ───────── */
  useEffect(() => {
    async function fetchData() {
      try {
        const { clients }: { clients: ClientShop[] } =
          await fetchFromAPI("/dashboardadmin/clientShop");
        setClients(clients);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ───────── server actions ───────── */
  const deleteClient = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/client-shop/${id}`, {
      method: "DELETE",
    });
    setClients((prev) => prev.filter((c) => c._id !== id));
  };

  /* ───────── popup helpers ───────── */
  const openDelete = (id: string, name: string) => {
    setDeleteClientId(id);
    setDeleteClientName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteClient(id);
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
        <h1 className="text-3xl font-bold uppercase">All Clients Magasin</h1>
        <Link href="/dashboard/manage-client/clients-shop/create">
          <button className="w-[250px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Client
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label htmlFor="searchClient" className="font-medium">
            Search by Name:
          </label>
          <input
            id="searchClient"
            className="border border-gray-300 rounded px-2 py-1"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Enter client name"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 w-1/3 text-center">Client Name</th>
              <th className="px-4 py-2 text-center border-x-4">Phone</th>
              <th className="px-4 py-2 w-1/3 text-center">Email</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        {/* Table body */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedClients.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-600">
                    No clients found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedClients.map((c) => (
                  <tr key={c._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center font-semibold text-gray-800">
                      {c.name}
                    </td>
                    <td className="px-4 text-center">{c.phone}</td>
                    <td className="px-4 text-center">{c.email || "—"}</td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          href={`/dashboard/manage-client/clients-shop/update/${c._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(c._id, c.name)}
                          className="ButtonSquare"
                          aria-label="Delete client"
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
          id={deleteClientId}
          name={deleteClientName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
