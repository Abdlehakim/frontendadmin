// src/app/dashboard/manage-client/orders/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ───────── types ───────── */
interface Order {
  _id: string;
  ref: string;
  clientName: string;
  user: { _id: string; username?: string; email: string } | null;
  pickupMagasin?: {
    Magasin: string;
    MagasinAddress: string;
  };
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
  "Processing",
  "Shipped",
  "Cancelled",
  "Refunded",
  "Delivered",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  /* delete-popup state */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState("");
  const [deleteOrderRef, setDeleteOrderRef] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ───────── derived lists ───────── */
  const filteredOrders = useMemo(
    () =>
      orders
        .filter((o) => !filterStatus || o.orderStatus === filterStatus)
        .filter((o) =>
          o.ref.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [orders, filterStatus, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const displayedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  /* ───────── fetch orders ───────── */
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

  /* ───────── server actions ───────── */
  const deleteOrder = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/orders/${id}`, {
      method: "DELETE",
    });
    setOrders((prev) => prev.filter((o) => o._id !== id));
  };

  const updateStatus = async (id: string, status: string) => {
    await fetchFromAPI(`/dashboardadmin/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: status }),
    });
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, orderStatus: status } : o))
    );
  };

  /* ───────── popup helpers ───────── */
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
        <h1 className="text-3xl font-bold uppercase">Commandes</h1>
        <Link href="/dashboard/manage-client/orders/create">
          <button className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer">
            Create Commande
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-end gap-6 h-[70px]">
        <div className="flex items-center gap-2">
          <label htmlFor="searchOrder" className="font-medium">
            Search by Ref:
          </label>
          <input
            id="searchOrder"
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="Enter ref"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="statusFilter" className="font-medium">
            Filter by Status:
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
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center">REF</th>
              <th className="px-4 py-2 text-center">Client Name</th>
              <th className="px-4 py-2 text-center">Delivery Address</th>
              <th className="px-4 py-2 text-center">Retrait en magasin</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedOrders.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-600">
                    No orders found.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedOrders.map((o) => (
                  <tr key={o._id} className="even:bg-gray-100 odd:bg-white">
                    <td className="px-4 text-center truncate font-semibold">
                      {o.ref}
                    </td>
                    <td className="px-4 text-center">{o.clientName}</td>
                    <td className="px-4 text-center truncate">
                      {o.DeliveryAddress[0]?.DeliverToAddress ?? "—"}
                    </td>
                    <td className="px-4 text-center">
                      {o.pickupMagasin?.MagasinAddress ?? "—"}
                    </td>
                    <td className="px-4 text-center">
                      <select
                        value={o.orderStatus}
                        onChange={(e) =>
                          updateStatus(o._id, e.target.value)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          href={`/dashboard/manage-client/orders/voir/${o._id}`}
                        >
                          <button className="ButtonSquare">
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(o._id, o.ref)}
                          className="ButtonSquare"
                          aria-label="Delete order"
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
