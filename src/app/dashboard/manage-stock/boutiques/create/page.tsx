// src/app/manage-stock/boutiques/create/page.tsx
"use client";

import React, { ChangeEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Stepper from "@/components/Stepper";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import Overlay from "@/components/Overlay";
import { MdArrowForwardIos, MdDelete, MdAdd } from "react-icons/md";
import { PiImage } from "react-icons/pi";

/* ---------- helper types ---------- */
interface TimeRange {
  open: string;
  close: string;
}
interface DayState {
  enabled: boolean;
  ranges: TimeRange[];
}
interface FormState {
  name: string;
  phoneNumber: string;
  address: string;
  city: string;
  localisation: string;
  image: File | null;
  openingHours: Record<string, DayState>;
}
type TextFieldKey =
  | "name"
  | "phoneNumber"
  | "address"
  | "city"
  | "localisation";

/* ---------- constants ---------- */
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const textFieldIds: readonly TextFieldKey[] = [
  "name",
  "phoneNumber",
  "address",
  "city",
  "localisation",
];

const MAX_RANGES = 3;

export default function CreateBoutiquePage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState<FormState>(() => ({
    name: "",
    phoneNumber: "",
    address: "",
    city: "",
    localisation: "",
    image: null,
    openingHours: Object.fromEntries(
      days.map((d) => [
        d,
        {
          enabled: false,
          ranges: [{ open: "09:00", close: "17:00" }],
        } as DayState,
      ])
    ) as Record<string, DayState>,
  }));

  /* Handlers */
  const onText = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as TextFieldKey;
    setForm((p) => ({ ...p, [name]: e.target.value }));
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, image: e.target.files?.[0] ?? null }));
  const clearImage = () => {
    setForm((p) => ({ ...p, image: null }));
    if (fileInput.current) fileInput.current.value = "";
  };

  const toggleDay = (day: string, enabled: boolean) =>
    setForm((p) => ({
      ...p,
      openingHours: {
        ...p.openingHours,
        [day]: { ...p.openingHours[day], enabled },
      },
    }));
  const setTime = (
    day: string,
    idx: number,
    field: "open" | "close",
    value: string
  ) =>
    setForm((p) => {
      const next = { ...p.openingHours[day] };
      next.ranges[idx] = { ...next.ranges[idx], [field]: value };
      return { ...p, openingHours: { ...p.openingHours, [day]: next } };
    });
  const addRange = (day: string) =>
    setForm((p) => {
      const next = { ...p.openingHours[day] };
      if (next.ranges.length < MAX_RANGES)
        next.ranges = [...next.ranges, { open: "09:00", close: "17:00" }];
      return { ...p, openingHours: { ...p.openingHours, [day]: next } };
    });
  const removeRange = (day: string, idx: number) =>
    setForm((p) => {
      const next = { ...p.openingHours[day] };
      next.ranges = next.ranges.filter((_, i) => i !== idx);
      return { ...p, openingHours: { ...p.openingHours, [day]: next } };
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("phoneNumber", form.phoneNumber.trim());
      fd.append("address", form.address.trim());
      fd.append("city", form.city.trim());
      fd.append("localisation", form.localisation.trim());
      if (form.image) fd.append("image", form.image);

      const oh: Record<string, TimeRange[]> = {};
      for (const d of days) {
        const { enabled, ranges } = form.openingHours[d];
        if (enabled) oh[d] = ranges;
      }
      fd.append("openingHours", JSON.stringify(oh));

      await fetchFromAPI<{ message: string }>(
        "/dashboardadmin/stock/boutiques/create",
        { method: "POST", body: fd }
      );

      setShowSuccess(true);
      setSubmitting(false);
      setTimeout(() => router.push("/dashboard/manage-stock/boutiques"), 3000);
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create boutique. Please try again."
      );
    }
  };

  return (
    <div className="w-[80%]flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Create Boutique</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link
            href="/dashboard/manage-stock/boutiques"
            className="text-gray-500 hover:underline"
          >
            All Boutiques
          </Link>
          <MdArrowForwardIos className="text-gray-400" />
          <span className="text-gray-700 font-medium">Create Boutique</span>
        </nav>
      </div>

      <Stepper
        steps={["Details", "Opening_Hours", "Review"]}
        currentStep={step}
        onStepClick={setStep}
      />

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="flex flex-col justify-between gap-8 h-4/5 w-4/5 mx-auto "
      >
        {step === 1 && (
          <>
            {/* Step 1: Details */}
            <div className="flex gap-4 max-xl:flex-col">
              <div className="flex flex-col gap-4 w-1/2 max-xl:w-full h-full px-6">
                {textFieldIds.map((id) => (
                  <label key={id} className="flex flex-col gap-1">
                    <span className="text-sm font-medium capitalize">
                      {id === "name" ? "Name*" : id}
                    </span>
                    <input
                      name={id}
                      value={form[id] as string}
                      onChange={onText}
                      required={id === "name"}
                      className="border-2 border-gray-300 rounded px-3 py-2"
                    />
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-4 w-1/2 max-xl:w-full">

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  className="hidden"
                />


                <div
                  onClick={() => fileInput.current?.click()}
                  className="relative border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition h-full min-h-[400px]"
                >
                  {/* top-right icon */}
                  <div className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <PiImage size={24} />
                  </div>

                  {/* content */}
                  {form.image ? (
                    <div className="relative w-full h-full rounded overflow-hidden bg-amber-400">


                      {/* preview */}
                      <Image
                        src={URL.createObjectURL(form.image)}
                        alt="Main Preview"
                        fill
                        className="object-cover"
          
                      />{" "}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearImage();
                        }}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-100 transition"
                      >
                        <MdDelete size={16} className="text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Click to upload
                      <br />
                      Main Image
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-8 pb-8">
              <Link href="/dashboard/manage-stock/boutiques">
                <button
                  type="button"
                  className="px-6 py-2 bg-quaternary text-white rounded"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-tertiary text-white rounded"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Step 2: Opening Hours */}
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold">Opening Hours</h2>
              <div className="flex flex-col gap-4">
                {days.map((day) => {
                  const { enabled, ranges } = form.openingHours[day];
                  return (
                    <div key={day} className="lg:flex gap-4">
                      <div className="flex gap-2 items-center py-2">
                        <label className="relative inline-flex cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={enabled}
                            onChange={(e) => toggleDay(day, e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all" />
                        </label>
                        <span className="w-24">{day}
                        </span>
                        {enabled && ranges.length < MAX_RANGES && (
                          <button
                            type="button"
                            onClick={() => addRange(day)}
                            title="Add range"
                            className="ButtonSquare"
                          >
                            <MdAdd size={18} />
                          </button>
                        )}
                      </div>
                      <div className="flex max-lg:flex-col gap-4 items-center">
                        {enabled &&
                          ranges.map((r, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={r.open}
                                onChange={(e) =>
                                  setTime(day, idx, "open", e.target.value)
                                }
                                className="border border-gray-300 bg-inputcolor rounded px-2 h-[32]"
                              />
                              <span>-</span>
                              <input
                                type="time"
                                value={r.close}
                                onChange={(e) =>
                                  setTime(day, idx, "close", e.target.value)
                                }
                                className="border border-gray-300 bg-inputcolor rounded px-3 h-[32]"
                              />
                              {ranges.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRange(day, idx)}
                                  className="ButtonSquare"
                                  title="Delete range"
                                >
                                  <MdDelete size={18} />
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <div className="flex justify-center gap-8 pb-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-quaternary text-white rounded"
              >
                Back
              </button>
              <Link href="/dashboard/manage-stock/boutiques">
                <button
                  type="button"
                  className="px-6 py-2 bg-quaternary text-white rounded"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-tertiary text-white rounded"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Step 3: Review */}
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold">Review Details</h2>
              <div className="flex max-lg:flex-col gap-8 justify-between w-[60%]">
                <div className="space-y-2">
                  <div>
                    <strong>Name:</strong> {form.name}
                  </div>
                  <div>
                    <strong>Phone:</strong> {form.phoneNumber}
                  </div>
                  <div>
                    <strong>Address:</strong> {form.address}
                  </div>
                  <div>
                    <strong>City:</strong> {form.city}
                  </div>
                  <div>
                    <strong>Localisation:</strong> {form.localisation}
                  </div>
                  <strong>Image:</strong>
                </div>
                <div className="flex flex-col max-lg:items-center">

                  {form.image && (
                    <Image
                      src={URL.createObjectURL(form.image)}
                      alt="Preview"
                      width={200}
                      height={400}
                      className="max-w-xs w-[100px] h-[150px] object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="font-semibold">Opening Hours:</h3>
                <ul className="list-disc pl-6">
                  {days.map((day) => {
                    const { enabled, ranges } = form.openingHours[day];
                    return enabled ? (
                      <li key={day}>
                        <strong>{day}:</strong>{" "}
                        {ranges.map((r) => `${r.open}-${r.close}`).join(", ")}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            </section>
            <div className="flex justify-center gap-8 pb-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-quaternary text-white rounded"
              >
                Back
              </button>
              <Link href="/dashboard/manage-stock/boutiques">
                <button
                  type="button"
                  className="px-6 py-2 bg-quaternary text-white rounded"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-tertiary text-white rounded"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </>
        )}
      </form>

      {/* Overlays */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Boutique was successfully created" : undefined}
        spinnerSize={60}
      />

      {/* Error popup */}
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
