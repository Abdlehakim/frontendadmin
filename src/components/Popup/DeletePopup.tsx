// src/components/Popup/DeletePopup.tsx
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";

interface PopupProps {
  handleClosePopup: () => void;
  Delete: (id: string) => Promise<void>;
  id: string;
  name: string;
  isLoading: boolean;
}

const Popup: React.FC<PopupProps> = ({
  handleClosePopup,
  Delete,
  id,
  name,
  isLoading,
}) => {
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const isDeleteConfirmed = inputValue.toUpperCase();

  useEffect(() => {
    setIsButtonVisible(isDeleteConfirmed !== "DELETE");
  }, [isDeleteConfirmed]);

  return (
    <div className="min-w-screen h-screen animated fadeIn faster fixed inset-0 z-50 flex justify-center items-center bg-no-repeat bg-center bg-cover backdrop-filter backdrop-brightness-75">
      <div className="relative flex flex-col gap-4 w-full max-w-lg p-6 mx-auto my-auto bg-white rounded-xl shadow-lg">
        <div className="text-center flex flex-col gap-4">
          <p className="text-lg text-black">
            Do you really want to delete{" "}
            <span className="text-red-500 font-bold">{name}</span>?<br />
            To confirm, type{" "}
            <span className="text-red-500 font-bold">DELETE</span>:
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="w-full border-2 border-gray-400 rounded p-2 text-center uppercase"
          />
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => Delete(id)}
            disabled={isButtonVisible || isLoading}
            className="flex items-center justify-center px-5 py-2 bg-tertiary text-white rounded hover:bg-hoverButton transition disabled:opacity-50"
          >
            {isLoading ? <FaSpinner className="animate-spin text-xl" /> : "Delete"}
          </button>
          <button
            onClick={handleClosePopup}
            disabled={isLoading}
            className="px-5 py-2 bg-quaternary text-white rounded hover:bg-hoverButton transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
