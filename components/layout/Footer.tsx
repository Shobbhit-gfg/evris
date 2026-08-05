import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black px-6 pt-16 pb-14 text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-end justify-between gap-10 px-4">

        {/* Brand */}
        <div>
          <p className="heading-font text-[72px] font-semibold leading-none">
            EVRIS
          </p>
          <p className="body-font mt-2 text-[20px] text-[#dddada]">
            Built for smarter event memories.
          </p>
          <p className="body-font mt-2 text-[16px] text-[#8a8a8a]">
            © 2026 . Built for smarter event memories.
          </p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap gap-8 text-[20px] text-[#dddada]">
          <Link href="#" className="transition hover:text-white">
            Youtube
          </Link>
          <Link href="#" className="transition hover:text-white">
            Instagram
          </Link>
          <Link href="#" className="transition hover:text-white">
            Facebook
          </Link>
          <Link href="#" className="transition hover:text-white">
            Report
          </Link>
          <Link href="/contact" className="transition hover:text-white">
            Contact Us
          </Link>
        </nav>

      </div>
    </footer>
  );
}