"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

interface Client {
  _id: string;
  username?: string;
  phone?: string;
  email: string;
  isGoogleAccount?: boolean;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // delete popup state
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deleteClientId, setDeleteClientId] = useState<string>("");
  const [deleteClientName, setDeleteClientName] = useState<string>("");

  const pageSize = 12;

  // filtered + paginated
  const filteredClients = useMemo(() => {
    return clients
      .filter(c =>
        !filterType ||
        (filterType === "Google" ? c.isGoogleAccount : !c.isGoogleAccount)
      )
      .filter(c =>
        !searchTerm ||
        (c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (c.phone || "").includes(searchTerm))
      );
  }, [clients, filterType, searchTerm]);

  const totalPages = useMemo(
    () => Math.ceil(filteredClients.length / pageSize),
    [filteredClients.length]
  );

  const displayedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage]);

  // fetch clients
  useEffect(() => {
    async function fetchData() {
      try {
        const { clients } = await fetchFromAPI<{ clients: Client[] }>(
          "/dashboardadmin/client"
        );
        setClients(clients);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const deleteClient = async (id: string) => {
    try {
      await fetchFromAPI(`/dashboardadmin/client/delete/${id}`, { method: "DELETE" });
      setClients(prev => prev.filter(c => c._id !== id));
    } catch {
      alert("Deletion failed.");
    }
  };

  // popup handlers
  const openDelete = (id: string, name: string) => {
    setDeleteClientId(id);
    setDeleteClientName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);
  const confirmDelete = () => {
    deleteClient(deleteClientId);
    closeDelete();
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* header & create */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">All Clients</h1>
        <Link href="/dashboard/manage-access/clients/create">
          <button className="w-[250px] h-[40px] bg-tertiary text-white rounded hover:opacity-90">
            Create New Client
          </button>
        </Link>
      </div>

      {/* filters */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label htmlFor="searchClient" className="font-medium">
            Search:
          </label>
          <input
            id="searchClient"
            type="text"
            placeholder="Username, email or phone"
            className="border border-gray-300 rounded px-2 py-1"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="typeFilter" className="font-medium">
            Filter by Type:
          </label>
          <select
            id="typeFilter"
            className="border border-gray-300 rounded px-2 py-1"
            value={filterType}
            onChange={e => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="Standard">Standard</option>
            <option value="Google">Google</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 w-1/5 text-center">Username</th>
              <th className="px-4 py-2 w-1/5 text-center">Email</th>
              <th className="px-4 py-2 w-1/5 text-center">Phone</th>
              <th className="px-4 py-2 w-1/5 text-center">Type</th>
              <th className="px-4 py-2 w-1/5 text-center">Action</th>
            </tr>
          </thead>
        </table>
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedClients.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    No clients found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedClients.map(c => (
                  <tr key={c._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center font-semibold text-gray-800">
                      {c.username || "-"}
                    </td>
                    <td className="px-4 text-center">{c.email}</td>
                    <td className="px-4 text-center">{c.phone || "-"}</td>
                    <td className="px-4 text-center">{c.isGoogleAccount ? "Google" : "Standard"}</td>
                    <td className="px-4 text-center">
                      <button
                        onClick={() => openDelete(c._id, c.username || c.email)}
                        className="ButtonSquare"
                        aria-label="Delete client"
                      >
                        <FaTrashAlt size={14} />
                      </button>
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

      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {isDeleteOpen && (
        <Popup
          id={deleteClientId}
          name={deleteClientName}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
