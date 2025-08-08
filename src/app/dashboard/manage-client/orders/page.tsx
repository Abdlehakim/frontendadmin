// ------------------------------------------------------------------
// src/app/dashboard/manage-client/orders/page.tsx
// Liste des commandes (table + filtres + pagination)
// MAJ (Août 2025) : pickupMagasin est désormais un ARRAY
//                   + ajout de la colonne « Date » avant la REF
// ------------------------------------------------------------------
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEye, FaTrashAlt, FaRegEdit } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";
import DateFilter, { DateRange } from "@/components/DateFilter";

/* ───────── helpers ───────── */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/* ───────── types ───────── */
interface Order {
  _id: string;
  ref: string;
  clientName: string;
  user: { _id: string; username?: string; email: string } | null;
  pickupMagasin: Array<{
    Magasin: string;
    MagasinAddress: string;
  }>;
  createdAt: string;
  orderStatus: string;
  deliveryMethod: string;
  deliveryCost?: number;
  DeliveryAddress: Array<{
    Address: string;
    DeliverToAddress: string;
  }>;
}

const pageSize = 8;

const statusOptions = [
  { value: "Processing", label: "En cours" },
  { value: "Shipped", label: "Expédiée" },
  { value: "Cancelled", label: "Annulée" },
  { value: "Refunded", label: "Remboursée" },
  { value: "Delivered", label: "Livrée" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState("");
  const [deleteOrderRef, setDeleteOrderRef] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((o) => !filterStatus || o.orderStatus === filterStatus)
        .filter((o) => o.ref.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((o) => {
          if (!dateRange) return true;
          const d = new Date(o.createdAt);
          return d >= dateRange.start && d <= dateRange.end;
        }),
    [orders, filterStatus, searchTerm, dateRange]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const displayedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { orders } = await fetchFromAPI<{ orders: Order[] }>(
          "/dashboardadmin/orders"
        );
        setOrders(orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const deleteOrder = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/orders/${id}`, {
      method: "DELETE",
    });
    setOrders((prev) => prev.filter((o) => o._id !== id));
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetchFromAPI(`/dashboardadmin/orders/updateStatus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, orderStatus: status } : o))
      );
    } catch (err) {
      console.error("Update status error ▶", err);
      alert("Échec de la mise à jour du statut.");
    }
  };

  const openDelete = (id: string, ref: string) => {
    setDeleteOrderId(id);
    setDeleteOrderRef(ref);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteOrder(id);
    } catch {
      alert("Échec de la suppression.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Commandes</h1>
        <Link href="/dashboard/manage-client/orders/create">
          <button className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer">
            Créer une commande
          </button>
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="searchOrder" className="font-medium">
            Rechercher par réf :
          </label>
          <input
            id="searchOrder"
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="Entrer la référence"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">Filtrer par date :</label>
            <DateFilter
              onChange={(range) => {
                setDateRange(range);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="font-medium">
              Filtrer par statut :
            </label>
            <select
              id="statusFilter"
              className="border border-gray-300 rounded px-2 py-1"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center">Date</th>
              <th className="px-4 py-2 text-center">Référence</th>
              <th className="px-4 py-2 text-center">Nom client</th>
              <th className="px-4 py-2 text-center">Adresse de livraison</th>
              <th className="px-4 py-2 text-center">Retrait magasin</th>
              <th className="px-4 py-2 text-center">Statut</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedOrders.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-600">
                    Aucune commande trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedOrders.map((o) => (
                  <tr key={o._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 text-center truncate font-semibold">
                      {o.ref}
                    </td>
                    <td className="px-4 text-center">{o.clientName}</td>
                    <td className="px-4 text-center truncate">
                      {o.DeliveryAddress[0]?.DeliverToAddress ?? "—"}
                    </td>
                    <td className="px-4 text-center">
                      {o.pickupMagasin.length > 0
                        ? o.pickupMagasin[0].MagasinAddress
                        : "—"}
                    </td>
                    <td className="px-4 text-center">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer"
                      >
                        {statusOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          href={`/dashboard/manage-client/orders/update/${o._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <Link href={`/dashboard/manage-client/orders/voir/${o._id}`}>
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(o._id, o.ref)}
                          className="ButtonSquare"
                          aria-label="Supprimer la commande"
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

      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {isDeleteOpen && (
        <Popup
          id={deleteOrderId}
          name={deleteOrderRef}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
