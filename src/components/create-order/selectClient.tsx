/* ------------------------------------------------------------------
   Sélection d’un client pour la création de commande
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaSearch, FaSpinner, FaTimesCircle } from "react-icons/fa";

/* ---------- constants ---------- */
const MIN_CHARS = 2;
const DEBOUNCE  = 300;

/* ---------- types ---------- */
export interface Client {
  _id: string;
  username?: string;
  phone?: string;
  email: string;
}

interface SelectClientProps {
  client: Client | null;
  onSelect(client: Client): void;
  onClear(): void;
}

/* ---------- component ---------- */
export default function SelectClient({
  client,
  onSelect,
  onClear,
}: SelectClientProps) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const boxRef                  = useRef<HTMLDivElement>(null);

  /* ───────── search effect ───────── */
  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      setError("");
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { clients } = await fetchFromAPI<{ clients: Client[] }>(
          `/dashboardadmin/client/find?q=${encodeURIComponent(query.trim())}`
        );
        setResults(clients);
        if (clients.length === 0) setError("Aucun résultat.");
      } catch {
        setError("Erreur de recherche.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);
    return () => clearTimeout(id);
  }, [query]);

  /* ───────── close dropdown on outside click ───────── */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setResults([]);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ───────── UI ───────── */
  if (client)
    return (
      <div className="border rounded-lg p-4 bg-white space-y-2">
        <div className="flex justify-between items-start">
          <h2 className="font-bold">Client sélectionné</h2>
          <button
            onClick={onClear}
            className="text-red-600 flex items-center gap-1"
          >
            <FaTimesCircle /> Changer
          </button>
        </div>
        <p><strong>Nom :</strong> {client.username || "—"}</p>
        <p><strong>Email :</strong> {client.email}</p>
        <p><strong>Téléphone :</strong> {client.phone || "—"}</p>
      </div>
    );

  return (
    <div ref={boxRef} className="relative">
      <label className="font-semibold">Client :</label>
      <div className="flex gap-2 mt-1">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
          placeholder="Email ou téléphone…"
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />
        <div className="bg-primary text-white px-4 py-2 rounded flex items-center">
          {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
        </div>
      </div>
      {query && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
          {results.map((c) => (
            <li
              key={c._id}
              onClick={() => {
                onSelect(c);
                setQuery("");
                setResults([]);
              }}
              className="cursor-pointer px-3 py-2 hover:bg-gray-100 flex flex-col"
            >
              <span className="font-medium">{c.username || "—"}</span>
              <span className="text-sm text-gray-600">{c.email}</span>
              {c.phone && (
                <span className="text-xs text-gray-500">{c.phone}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && !loading && (
        <p className="text-red-600 mt-1 text-sm">{error}</p>
      )}
    </div>
  );
}
