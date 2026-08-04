"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex h-14 items-center justify-between bg-[#f3f3f3] px-10 shadow-sm">

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-medium tracking-tight text-black"
        >
          EVRIS
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-10 text-sm text-gray-700">
          <Link href="/login" className="hover:text-black transition">
            Admin
          </Link>

          <Link href="/features" className="hover:text-black transition">
            Features
          </Link>

          <Link href="/gallery" className="hover:text-black transition">
            Gallery
          </Link>

          <Link href="/events" className="hover:text-black transition">
            Events
          </Link>

          <Link href="/contact" className="hover:text-black transition">
            Contact
          </Link>
        </div>

      </nav>
    </header>
  );
}