// ───────────────────────────────────────────────────────────────
// src/app/dashboard/manage-client/client-company/page.tsx
// Liste & gestion des « ClientCompany » (clients entreprise)
// ───────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ---------- types ---------- */
interface ClientCompany {
  _id: string;
  companyName: string;
  contactName?: string;
  phone: string;
  email?: string;
  vatNumber?: string;
}

const pageSize = 12;

export default function ClientCompanyPage() {
  /* ---------- state ---------- */
  const [companies, setCompanies]     = useState<ClientCompany[]>([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(true);

  /* delete‑popup state */
  const [isDeleteOpen, setIsDeleteOpen]   = useState(false);
  const [deleteId, setDeleteId]           = useState("");
  const [deleteName, setDeleteName]       = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---------- filtered data & pagination ---------- */
  const filtered = useMemo(
    () =>
      companies.filter((c) =>
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [companies, searchTerm],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  /* ---------- fetch companies ---------- */
  useEffect(() => {
    async function load() {
      try {
        const { companies }: { companies: ClientCompany[] } =
          await fetchFromAPI("/dashboardadmin/clientCompany");
        setCompanies(companies);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------- server actions ---------- */
  const deleteCompany = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/client-company/${id}`, {
      method: "DELETE",
    });
    setCompanies((prev) => prev.filter((c) => c._id !== id));
  };

  /* ---------- popup helpers ---------- */
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteCompany(id);
    } catch {
      alert("Deletion failed.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  /* ---------- render ---------- */
  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">All Client Companies</h1>
        <Link href="/dashboard/manage-client/client-company/create">
          <button className="w-[250px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Company
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label htmlFor="searchCompany" className="font-medium">
            Search by Name:
          </label>
          <input
            id="searchCompany"
            className="border border-gray-300 rounded px-2 py-1"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Enter company name"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 w-[30%] text-center">Company</th>
              <th className="px-4 py-2 text-center border-x-4">Phone</th>
              <th className="px-4 py-2 w-[25%] text-center">Email</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        {/* Table body */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-600">
                    No companies found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((c) => (
                  <tr key={c._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center font-semibold text-gray-800">
                      {c.companyName}
                    </td>
                    <td className="px-4 text-center">{c.phone}</td>
                    <td className="px-4 text-center">{c.email || "—"}</td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          href={`/dashboard/manage-client/client-company/update/${c._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(c._id, c.companyName)}
                          className="ButtonSquare"
                          aria-label="Delete company"
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
