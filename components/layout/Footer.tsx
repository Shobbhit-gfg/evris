import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-[91px] flex h-[175px] w-full items-center bg-black px-[22px] text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-10">

        {/* Brand */}
        <div>
          <p className="heading-font text-[72px] font-semibold leading-none">
            evris
          </p>
          <p className="body-font mt-2 text-[20px] text-[#dddada]">
            Built for smarter event memories.
          </p>
          <p className="body-font mt-2 text-[16px] text-[#8a8a8a]">
            © 2026 . Built for smarter event memories.
          </p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap items-center gap-8 text-[20px] text-[#dddada]">
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