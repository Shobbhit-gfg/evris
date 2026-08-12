"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Events", href: "/admin/events" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Find me", href: "/admin/find-me" },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <div
      className="
        relative mx-auto mt-[30px] flex h-[88px] w-full max-w-[1174px] items-center
        rounded-[34px] bg-[#888787] px-2
      "
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <div key={tab.label} className="flex flex-1 justify-center px-2">
            <Link
              href={tab.href}
              className={`
                body-font relative z-10 flex h-[56px] w-[85%] items-center justify-center
                rounded-[28px] text-[18px] transition-all duration-300
                ${isActive
                  ? "border border-white/30 bg-white/15 font-semibold text-white backdrop-blur-md shadow-[0px_4px_20px_rgba(0,0,0,0.15)]"
                  : "text-white/80 hover:text-white"}
              `}
            >
              {tab.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}