// src/components/addproductsteps/WizardNav.tsx
"use client";

import React from "react";

interface Props {
  step: 1 | 2 | 3 | 4;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  submitLabel?: string;
  submittingLabel?: string;
}

export default function WizardNav({
  step,
  saving,
  onBack,
  onNext,
  onCancel,
  submitLabel = "Ajouter le produit",
  submittingLabel = "Ajout en cours...",
}: Props) {
  const btn =
    "w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer";

  return (
    <div className="flex w-[80%] mx-auto justify-between pb-8 gap-8">
      <button type="button" onClick={onCancel} className={btn}>
        Annuler
      </button>

  <div className="flex justify-center gap-8">
      {step > 1 && (
        <button type="button" onClick={onBack} className={btn}>
          Précédent
        </button>
      )}

      {step < 4 && (
        <button type="button" onClick={onNext} className={btn}>
          Suivant
        </button>
      )}

      {step === 4 && (
        <button type="submit" disabled={saving} className={btn}>
          {saving ? submittingLabel : submitLabel}
        </button>
      )}
    </div></div>
  );
}
