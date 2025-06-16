// src/components/Overlay.tsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

interface OverlayProps {
  /** Whether the overlay is visible */
  show: boolean;
  /** If provided, render this message instead of the spinner */
  message?: string;
  /** Spinner size when showing loader */
  spinnerSize?: number;
}

export default function Overlay({
  show,
  message,
  spinnerSize = 60,
}: OverlayProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {message ? (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold">{message}</p>
        </div>
      ) : (
        <FaSpinner className="animate-spin text-white" size={spinnerSize} />
      )}
    </div>
  );
}
