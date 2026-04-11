"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/planner", label: "Planner" },
  { href: "/pipeline", label: "Pipeline" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 20,
      }}
    >
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              background: active ? "#1a1a1a" : "#fff",
              color: active ? "#fff" : "#666",
              border: `1px solid ${active ? "#1a1a1a" : "#e6e6e6"}`,
              textDecoration: "none",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
