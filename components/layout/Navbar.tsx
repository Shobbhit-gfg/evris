"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Admin", href: "/login" },
    { label: "Features", href: "/features" },
    { label: "Gallery", href: "/gallery" },
    { label: "Events", href: "/events" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 mx-auto flex items-center justify-between px-[59px]
        transition-all duration-300 ease-out
        ${scrolled
          ? "h-16 bg-white/80 backdrop-blur-lg shadow-md border-b border-black/10"
          : "h-20 bg-white/40 backdrop-blur-md border-b border-black/10"}
      `}
    >
      <Link href="/" className="heading-font text-2xl font-semibold tracking-tight text-black">
        evris
      </Link>
      <div className="flex items-center gap-10 text-base font-semibold text-[#6e6e73]">
        {navLinks.map((link) => (
          <Link key={link.label} href={link.href} className="relative group text-[#6e6e73] hover:text-black transition">
            {link.label}
            <span className="absolute left-0 -bottom-1 h-[1.5px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
          </Link>
        ))}
      </div>
    </header>
  );
}