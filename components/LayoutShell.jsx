"use client";

import { usePathname } from "next/navigation";
import Shell from "./Shell";

export default function LayoutShell({ children }) {
  const pathname = usePathname();

  // Login page renders without Shell (no nav, no header)
  if (pathname === "/login") return <>{children}</>;

  return <Shell>{children}</Shell>;
}
