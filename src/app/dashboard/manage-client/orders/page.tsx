// ------------------------------------------------------------------
// src/app/dashboard/manage-client/orders/page.tsx
// ------------------------------------------------------------------
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEye, FaTrashAlt, FaRegEdit } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import DateFilter, { DateRange } from "@/components/DateFilter";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

interface Order {
  _id: string;
  ref: string;
  clientName: string;
  user: { _id: string; username?: string; email: string } | null;
  pickupMagasin: Array<{ Magasin: string; MagasinAddress: string }>;
  createdAt: string;
  orderStatus: string;
  deliveryMethod: string;
  deliveryCost?: number;
  DeliveryAddress: Array<{ Address: string; DeliverToAddress: string }>;
  Invoice?: boolean;
}

const pageSize = 8;

const statusOptions = [
  { value: "Processing", label: "En cours" },
  { value: "Shipped", label: "Expédiée" },
  { value: "Delivered", label: "Livrée" },
  { value: "Pickup", label: "Retrait en magasin" },
  { value: "Cancelled", label: "Annulée" },
  { value: "Refunded", label: "Remboursée" },
] as const;

type StatusVal = (typeof statusOptions)[number]["value"];

type StringUnion = string;
interface NiceSelectProps<T extends StringUnion> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  display?: (v: T) => string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

function NiceSelect<T extends StringUnion>({
  value,
  options,
  onChange,
  display,
  className = "",
  disabled = false,
  loading = false,
}: NiceSelectProps<T>) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    setPos({ top: b.bottom + 4, left: b.left, width: b.width });
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (evt: MouseEvent) => {
      const t = evt.target as Node;
      if (btnRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest("[data-nice-select-root]")) return;
      setOpen(false);
    };
    const onMove = () => updatePos();
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled || loading) setOpen(false);
  }, [disabled, loading]);

  const label = display ? display(value) : String(value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (disabled || loading) return;
          setOpen((s) => !s);
        }}
        className={`min-w-[200px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
                    border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className} ${
                      disabled || loading
                        ? "bg-emerald-50 text-emerald-800 opacity-60 cursor-not-allowed"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || loading}
        disabled={disabled || loading}
      >
        <span className="truncate">{label}</span>
        {loading ? (
          <FaSpinner className="animate-spin shrink-0" />
        ) : (
          <FiChevronDown className="shrink-0" />
        )}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            data-nice-select-root
            className="fixed z-[1000]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div
              className="rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
              role="listbox"
            >
              {options.map((opt) => {
                const isActive = opt === value;
                const text = display ? display(opt) : String(opt);
                return (
                  <button
                    key={String(opt)}
                    type="button"
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2
                      ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700"}
                      hover:bg-emerald-100 hover:text-emerald-800`}
                    onClick={() => {
                      setOpen(false); // close immediately on selection
                      onChange(opt);
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border
                        ${isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}
                    >
                      <FiCheck size={12} />
                    </span>
                    <span className="truncate">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

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

  const [pendingInvoice, setPendingInvoice] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  const aliveRef = useRef(true);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    aliveRef.current = true;
    (async () => {
      try {
        const { orders } = await fetchFromAPI<{ orders: Order[] }>(
          "/dashboardadmin/orders"
        );
        if (!aliveRef.current) return;
        setOrders(orders);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Fetch orders failed:", msg);
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    })();
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const deleteOrder = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o._id !== id));
  };

  const pollInvoice = async (orderId: string) => {
    setPendingInvoice((prev) => ({ ...prev, [orderId]: true }));
    try {
      let delay = 1000;
      for (let i = 0; i < 10 && aliveRef.current; i++) {
        const { order } = await fetchFromAPI<{ order: Pick<Order, "_id" | "Invoice"> }>(
          `/dashboardadmin/orders/getOne/${orderId}`
        );
        if (order?.Invoice) {
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? { ...o, Invoice: true } : o))
          );
          break;
        }
        await sleep(delay);
        delay = Math.min(8000, Math.round(delay * 1.5));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Polling invoice failed:", msg);
    } finally {
      setPendingInvoice((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    }
  };

  const createInvoiceFromOrder = async (orderId: string) => {
    setPendingInvoice((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetchFromAPI<{ facture?: unknown; message?: string }>(
        `/dashboardadmin/factures/from-order/${orderId}`,
        { method: "POST" }
      );

      if (res?.facture) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, Invoice: true } : o))
        );
      } else {
        await pollInvoice(orderId);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Create facture (Pickup) failed:", msg);
      await pollInvoice(orderId);
    } finally {
      setPendingInvoice((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const current = orders.find((x) => x._id === id);
    if (!current) return;
    if (current.orderStatus === status) return; // no-op if unchanged

    setSavingStatus((p) => ({ ...p, [id]: true }));
    try {
      await fetchFromAPI(`/dashboardadmin/orders/updateStatus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, orderStatus: status } : o))
      );

      const shouldCreateOrPoll = status === "Pickup" || status === "Delivered";

      if (shouldCreateOrPoll) {
        if (current.Invoice) {
          setErrorMsg("Une facture a déjà été créée pour cette commande.");
        } else {
          if (status === "Pickup") {
            await createInvoiceFromOrder(id);
          } else {
            await pollInvoice(id);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Update status error ▶", msg);
      alert("Échec de la mise à jour du statut.");
    } finally {
      setSavingStatus((p) => {
        const c = { ...p };
        delete c[id];
        return c;
      });
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
            onChange={(ev) => {
              setSearchTerm(ev.target.value);
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
              onChange={(ev) => {
                setFilterStatus(ev.target.value);
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
              <th className="px-4 py-2 text-center">Facture</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedOrders.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-600">
                    Aucune commande trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedOrders.map((o) => {
                  const hasInvoice = !!o.Invoice;
                  const isPending = !!pendingInvoice[o._id] && !hasInvoice;
                  const isSaving = !!savingStatus[o._id];
                  return (
                    <tr key={o._id} className="even:bg-gray-100 odd:bg-white">
                      <td className="px-4 text-center">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 text-center truncate font-semibold">{o.ref}</td>
                      <td className="px-4 text-center">{o.clientName}</td>
                      <td className="px-4 text-center truncate">
                        {o.DeliveryAddress[0]?.DeliverToAddress ?? "—"}
                      </td>
                      <td className="px-4 text-center truncate">
                        {o.pickupMagasin.length > 0 ? o.pickupMagasin[0].MagasinAddress : "—"}
                      </td>
                      <td className="px-4 text-center">
                        <NiceSelect<StatusVal>
                          value={o.orderStatus as StatusVal}
                          options={statusOptions.map((s) => s.value)}
                          onChange={(v) => updateStatus(o._id, v)}
                          display={(v) =>
                            statusOptions.find((s) => s.value === v)?.label ?? v
                          }
                          className="mx-auto"
                          disabled={isSaving}
                          loading={isSaving}
                        />
                      </td>

                      <td className="px-4 text-center">
                        <span
                          className={`inline-block h-3 w-3 rounded-full ${
                            hasInvoice
                              ? "bg-emerald-500"
                              : isPending
                              ? "bg-gray-300 animate-pulse"
                              : "bg-gray-300"
                          }`}
                          title={
                            hasInvoice
                              ? "Facture créée"
                              : isPending
                              ? "Création en cours..."
                              : "Aucune facture"
                          }
                          aria-label={
                            hasInvoice
                              ? "Facture créée"
                              : isPending
                              ? "Création en cours..."
                              : "Aucune facture"
                          }
                        />
                      </td>

                      <td className="px-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <Link href={`/dashboard/manage-client/orders/update/${o._id}`}>
                            <button className="ButtonSquare" disabled={isSaving}>
                              <FaRegEdit size={14} />
                            </button>
                          </Link>
                          <Link href={`/dashboard/manage-client/orders/voir/${o._id}`}>
                            <button className="ButtonSquare" disabled={isSaving}>
                              <FaRegEye size={14} />
                            </button>
                          </Link>
                          <button
                            onClick={() => openDelete(o._id, o.ref)}
                            className="ButtonSquare"
                            aria-label="Supprimer la commande"
                            disabled={isSaving}
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {errorMsg && <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}
