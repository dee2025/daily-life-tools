"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomeButton() {
  const pathname = usePathname();

  // Do NOT show on homepage "/"
  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      className="
        fixed right-10 bottom-10 z-50
        bg-white border border-[#333]
        w-11 h-11 rounded-xl flex items-center justify-center
        shadow-[0_0_12px_rgba(0,0,0,0.4)]
        hover:bg-white hover:scale-110 transition
      "
    >
      <span className="text-xl">🏠</span>
    </Link>
  );
}
