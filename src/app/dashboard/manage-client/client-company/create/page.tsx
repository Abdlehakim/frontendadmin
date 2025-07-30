// ------------------------------------------------------------------
// src/app/dashboard/manage-client/client-company/create/page.tsx
// Page ‑ Création d’un « ClientCompany » (client entreprise)
// ------------------------------------------------------------------
"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { MdArrowForwardIos } from "react-icons/md";

/* ---------- types ---------- */
interface FormData {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  vatNumber: string;
}

export default function CreateClientCompanyPage() {
  const router = useRouter();

  /* ---------- state ---------- */
  const [form, setForm] = useState<FormData>({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    vatNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  /* ---------- handlers ---------- */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchFromAPI<{ message: string }>(
        "/dashboardadmin/clientCompany/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      router.push("/dashboard/manage-client/client-company");
    } catch (err) {
      console.error("Creation failed:", err);
      alert("Failed to create client company.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="w-[80%] flex flex-col gap-y-4 p-4">
      <h1 className="text-3xl font-bold">Create Client Company</h1>

      <nav className="text-sm underline-offset-1 underline flex items-center gap-2">
        <Link
          href="/dashboard/manage-client/client-company"
          className="text-gray-500 hover:underline"
        >
          All Companies
        </Link>
        <span className="text-gray-400">
          <MdArrowForwardIos />
        </span>
        <span className="text-gray-700 font-medium">Create Company</span>
      </nav>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[50px]">
        <div className="flex flex-wrap justify-center gap-[50px]">
          {/* Company Name */}
          <div className="w-[30%] flex items-center gap-[16px]">
            <label
              htmlFor="companyName"
              className="block text-sm font-medium mb-1"
            >
              Company Name*
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={form.companyName}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>

          {/* Contact Name (optional) */}
          <div className="w-[30%] flex items-center gap-[16px]">
            <label
              htmlFor="contactName"
              className="block text-sm font-medium mb-1"
            >
              Contact Name
            </label>
            <input
              id="contactName"
              name="contactName"
              type="text"
              value={form.contactName}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>

          {/* Email (optional) */}
          <div className="w-[30%] flex items-center gap-[16px]">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>

          {/* Phone */}
          <div className="w-[20%] flex items-center gap-[16px]">
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone*
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              required
              value={form.phone}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>

          {/* VAT Number (optional) */}
          <div className="w-[20%] flex items-center gap-[16px]">
            <label
              htmlFor="vatNumber"
              className="block text-sm font-medium mb-1"
            >
              VAT Number
            </label>
            <input
              id="vatNumber"
              name="vatNumber"
              type="text"
              value={form.vatNumber}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-inputcolor"
            />
          </div>
        </div>

        {/* actions */}
        <div className="flex justify-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-1/6 px-6 py-2 bg-tertiary text-white rounded hover:opacity-90 transition"
          >
            {submitting ? "Adding..." : "Add"}
          </button>

          <Link href="/dashboard/manage-client/client-company" className="w-1/6">
            <button
              type="button"
              className="w-full px-6 py-2 bg-quaternary text-white rounded hover:opacity-90 transition"
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
