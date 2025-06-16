// update/[boutiqueId]/page.tsx

"use client";

import React, { ChangeEvent, FormEvent, useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import Stepper from "@/components/Stepper";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import Overlay from "@/components/Overlay";
import { MdArrowForwardIos, MdDelete, MdAdd } from "react-icons/md";

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

export default function UpdateBoutiquePage() {
  const router = useRouter();
  const params = useParams();
  const boutiqueId = String(params.boutiqueId);
  const fileInput = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [initialImageUrl, setInitialImageUrl] = useState<string>("");
  const [form, setForm] = useState<FormState>({
    name: "",
    phoneNumber: "",
    address: "",
    city: "",
    localisation: "",
    image: null,
    openingHours: Object.fromEntries(
      days.map((d) => [
        d,
        { enabled: false, ranges: [{ open: "09:00", close: "17:00" }] } as DayState,
      ])
    ) as Record<string, DayState>,
  });

  /* Load existing boutique */
  useEffect(() => {
    async function load() {
      try {
        const b = await fetchFromAPI<{
          _id: string;
          name: string;
          phoneNumber?: string;
          address?: string;
          city?: string;
          localisation?: string;
          image: string;
          openingHours: Record<string, TimeRange[]>;
        }>(`/dashboardadmin/stock/boutiques/${boutiqueId}`);

        setInitialImageUrl(b.image);

        // build openingHours state
        const ohState: Record<string, DayState> = {};
        for (const d of days) {
          const ranges = b.openingHours[d] ?? [];
          ohState[d] = {
            enabled: ranges.length > 0,
            ranges: ranges.length > 0 ? ranges : [{ open: "09:00", close: "17:00" }],
          };
        }

        setForm({
          name: b.name,
          phoneNumber: b.phoneNumber ?? "",
          address: b.address ?? "",
          city: b.city ?? "",
          localisation: b.localisation ?? "",
          image: null,
          openingHours: ohState,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load boutique.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [boutiqueId]);

  /* Handlers */
  const onText = (e: ChangeEvent<HTMLInputElement>) => {
    const key = e.target.name as TextFieldKey;
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }));
  const clearImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    if (fileInput.current) fileInput.current.value = "";
  };
  const toggleDay = (day: string, enabled: boolean) =>
    setForm((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day], enabled },
      },
    }));
  const setTime = (
    day: string,
    idx: number,
    field: "open" | "close",
    value: string
  ) =>
    setForm((prev) => {
      const next = { ...prev.openingHours[day] };
      next.ranges[idx] = { ...next.ranges[idx], [field]: value };
      return { ...prev, openingHours: { ...prev.openingHours, [day]: next } };
    });
  const addRange = (day: string) =>
    setForm((prev) => {
      const next = { ...prev.openingHours[day] };
      if (next.ranges.length < MAX_RANGES)
        next.ranges = [...next.ranges, { open: "09:00", close: "17:00" }];
      return { ...prev, openingHours: { ...prev.openingHours, [day]: next } };
    });
  const removeRange = (day: string, idx: number) =>
    setForm((prev) => {
      const next = { ...prev.openingHours[day] };
      next.ranges = next.ranges.filter((_, i) => i !== idx);
      return { ...prev, openingHours: { ...prev.openingHours, [day]: next } };
    });

  /* Submit */
  const handleSubmit = async (e: FormEvent) => {
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
        if (form.openingHours[d].enabled) {
          oh[d] = form.openingHours[d].ranges;
        }
      }
      fd.append("openingHours", JSON.stringify(oh));

      await fetchFromAPI<{ message: string }>(
        `/dashboardadmin/stock/boutiques/update/${boutiqueId}`,
        { method: "PUT", body: fd }
      );

      setShowSuccess(true);
      setSubmitting(false);
      setTimeout(() => router.push("/dashboard/manage-stock/boutiques"), 2000);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to update boutique.");
    }
  };

  if (loading) return <Overlay show spinnerSize={60} />;

  return (
    <div className="w-[80%] mx-auto flex flex-col gap-6 p-4 relative h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Update Boutique</h1>
        <nav className="text-sm underline flex items-center gap-2">
          <Link href="/dashboard/manage-stock/boutiques" className="text-gray-500 hover:underline">
            All Boutiques
          </Link>
          <MdArrowForwardIos className="text-gray-400" />
          <span className="text-gray-700 font-medium">Update Boutique</span>
        </nav>
      </div>

      <Stepper steps={["Details", "Opening Hours", "Review"]} currentStep={step} onStepClick={setStep} />

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col justify-between gap-8 h-full">
        {step === 1 && (
          <>
            {/* Details */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 w-1/2">
                <p className="text-sm font-medium">Image</p>
                <input ref={fileInput} type="file" accept="image/*" onChange={onFile} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={submitting}
                  className="px-6 py-2 bg-tertiary text-white rounded"
                >
                  Choose file
                </button>
                {(form.image || initialImageUrl) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 truncate max-w-xs">
                      {form.image ? form.image.name : initialImageUrl.split("/").pop()}
                    </span>
                    <button type="button" onClick={clearImage} className="text-red-600 hover:text-red-800">
                      <MdDelete size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid gap-6 grid-cols-3">
                {textFieldIds.map((id) => (
                  <label key={id} className="flex flex-col gap-1">
                    <span className="text-sm font-medium capitalize">{id === "name" ? "Name*" : id}</span>
                    <input
                      name={id}
                      value={form[id] as string}
                      onChange={onText}
                      required={id === "name"}
                      className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-8">
              <Link href="/dashboard/manage-stock/boutiques">
                <button type="button" className="px-6 py-2 bg-quaternary text-white rounded">
                  Cancel
                </button>
              </Link>
              <button type="button" onClick={() => setStep(2)} className="px-6 py-2 bg-tertiary text-white rounded">
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Opening Hours */}
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold">Opening Hours</h2>
              <div className="flex flex-col gap-4">
                {days.map((day) => {
                  const { enabled, ranges } = form.openingHours[day];
                  return (
                    <div key={day} className="flex gap-8 items-center">
                      <label className="relative inline-flex cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={enabled}
                          onChange={(e) => toggleDay(day, e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all" />
                      </label>
                      <span className="w-24">{day}</span>
                      {enabled && ranges.length < MAX_RANGES && (
                        <button type="button" onClick={() => addRange(day)} title="Add range" className="ButtonSquare">
                          <MdAdd size={18} />
                        </button>
                      )}
                      {enabled &&
                        ranges.map((r, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={r.open}
                              onChange={(e) => setTime(day, idx, "open", e.target.value)}
                              className="border border-gray-300 bg-inputcolor rounded px-2 h-[32]"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={r.close}
                              onChange={(e) => setTime(day, idx, "close", e.target.value)}
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
                  );
                })}
              </div>
            </section>
            <div className="flex justify-center gap-8">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-2 bg-quaternary text-white rounded">
                Back
              </button>
              <Link href="/dashboard/manage-stock/boutiques">
                <button type="button" className="px-6 py-2 bg-quaternary text-white rounded">
                  Cancel
                </button>
              </Link>
              <button type="button" onClick={() => setStep(3)} className="px-6 py-2 bg-tertiary text-white rounded">
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Review */}
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold">Review Details</h2>
              <div className="flex gap-8 justify-between w-[60%]">
                <div className="space-y-2">
                  <div><strong>Name:</strong> {form.name}</div>
                  <div><strong>Phone:</strong> {form.phoneNumber}</div>
                  <div><strong>Address:</strong> {form.address}</div>
                  <div><strong>City:</strong> {form.city}</div>
                  <div><strong>Localisation:</strong> {form.localisation}</div>
                </div>
                <div className="flex flex-col items-center">
                  <strong>Image:</strong>
                  {(form.image || initialImageUrl) && (
                    <Image
                      src={form.image ? URL.createObjectURL(form.image) : initialImageUrl}
                      alt="Preview"
                      width={100}
                      height={150}
                      className="object-cover rounded"
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
            <div className="flex justify-center gap-8">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-2 bg-quaternary text-white rounded">
                Back
              </button>
              <Link href="/dashboard/manage-stock/boutiques">
                <button type="button" className="px-6 py-2 bg-quaternary text-white rounded">
                  Cancel
                </button>
              </Link>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-tertiary text-white rounded">
                {submitting ? "Updating..." : "Update Boutique"}
              </button>
            </div>
          </>
        )}
      </form>

      {/* Overlays */}
      <Overlay
        show={submitting || showSuccess}
        message={showSuccess ? "Boutique updated successfully" : undefined}
        spinnerSize={60}
      />

      {/* Error */}
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
