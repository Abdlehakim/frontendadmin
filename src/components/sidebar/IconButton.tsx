// src/components/sidebar/IconButton.tsx
"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
}

export default function IconButton({ icon, href, onClick }: Props) {
  const pathname = usePathname();
  const active = href ? pathname === href : false;

  // Added duration and ease for smoother color + scale transitions
  const base =
    "absolute -right-8 bottom-6 h-12 w-12 flex justify-center items-center rounded-md text-white border-2 bg-primary cursor-pointer";
  const normal = "hover:bg-secondary hover:scale-105";
  const act = "bg-secondary text-primary";

  const classes = `${base} ${active ? act : normal}`;

  if (onClick) {
    return (
      <button onClick={onClick} className={classes}>
        {icon}
      </button>
    );
  }

  return (
    <Link href={href!} className={classes}>
      {icon}
    </Link>
  );
}
