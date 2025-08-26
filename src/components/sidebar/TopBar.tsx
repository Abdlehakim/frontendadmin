// src/components/topbar/TopBar.tsx
"use client";

import { FiBell } from "react-icons/fi";

export default function TopBar() {
  return (
    <div className=" flex items-center h-fit py-4 mx-auto w-[95%]  bg-white text-primary">
<div className='flex justify-end w-full'>
      <button
        aria-label="Notifications"
        className="relative p-2 rounded-lg hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
      >
        <FiBell size={30} />
      </button></div>
    </div>
  );
}
