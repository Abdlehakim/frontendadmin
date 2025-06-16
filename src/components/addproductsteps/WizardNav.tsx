// src/components/addproductsteps/WizardNav.tsx
"use client";

import React from "react";

interface Props {
  step: 1 | 2 | 3 | 4;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  /** Label to show when not saving; defaults to “Add Product” */
  submitLabel?: string;
  /** Label to show while saving; defaults to “Adding…” */
  submittingLabel?: string;
}

export default function WizardNav({
  step,
  saving,
  onBack,
  onNext,
  onCancel,
  submitLabel = "Add Product",
  submittingLabel = "Adding...",
}: Props) {
  return (
    <div className="flex justify-center gap-8 py-8">
      {/* Cancel */}
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 bg-quaternary text-white rounded"
      >
        Cancel
      </button>

      {/* Back */}
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 bg-quaternary text-white rounded"
        >
          Back
        </button>
      )}

      {/* Next */}
      {step < 4 && (
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 bg-tertiary text-white rounded"
        >
          Next
        </button>
      )}

      {/* Submit */}
      {step === 4 && (
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-tertiary text-white rounded"
        >
          {saving ? submittingLabel : submitLabel}
        </button>
      )}
    </div>
  );
}
