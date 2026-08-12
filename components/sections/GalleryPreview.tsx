import Image from "next/image";
import Link from "next/link";

export default function GalleryPreview() {
  return (
    <section className="relative pt-6 pb-24">

      {/* Gallery Container */}
      <div className="mx-auto w-[1302px] max-w-[95vw]">
        <div className="rounded-[32px] bg-[#ccc] p-5 shadow-[0px_20px_60px_rgba(0,0,0,0.1)]">
          <div className="grid h-[632px] grid-cols-12 grid-rows-6 gap-4">

            {/* Top Left Portrait */}
            <Link href="/gallery" className="relative col-span-2 row-span-3 overflow-hidden rounded-[24px] group">
              <Image
                src="/gallery/gallery5.webp"
                alt="Gallery Image"
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
              />
            </Link>

            {/* Top Middle Portrait */}
            <Link href="/gallery" className="relative col-span-2 row-span-3 overflow-hidden rounded-[24px] group">
              <Image
                src="/gallery/gallery2.webp"
                alt="Gallery Image"
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
              />
            </Link>

            {/* Center Landscape */}
            <Link href="/gallery" className="relative col-span-4 row-span-6 overflow-hidden rounded-[24px] group">
              <Image
                src="/gallery/gallery3.webp"
                alt="Gallery Image"
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
              />
            </Link>

            {/* Right Portrait */}
            <Link href="/gallery" className="relative col-span-4 row-span-6 overflow-hidden rounded-[24px] group">
              <Image
                src="/gallery/gallery1.webp"
                alt="Gallery Image"
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
              />
            </Link>

            {/* Bottom Landscape */}
            <Link href="/gallery" className="relative col-span-4 row-span-3 overflow-hidden rounded-[24px] group">
              <Image
                src="/gallery/gallery4.webp"
                alt="Gallery Image"
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
              />
            </Link>

          </div>
        </div>
      </div>

      {/* Stats Bar — full viewport width, overlaid on the gallery's bottom edge, exact Figma styling */}
      <div
        className="
          absolute
          left-1/2
          bottom-24
          w-screen
          -translate-x-1/2
          translate-y-1/2
          bg-[#f7f7f7]
          py-[25px]
          drop-shadow-[0px_14px_12.05px_rgba(13,3,2,0.25)]
        "
      >
        <div className="mx-auto flex w-full max-w-[1440px] justify-between pl-[105px] pr-[41px]">

          <div>
            <h3 className="heading-font text-[48px] font-semibold text-black leading-none">
              5000 +
            </h3>
            <p className="body-font mt-2 text-[20px] text-black">
              Photos Captured
            </p>
          </div>

          <div>
            <h3 className="heading-font text-[48px] font-semibold text-black leading-none">
              15 +
            </h3>
            <p className="body-font mt-2 text-[20px] text-black">
              Club Members
            </p>
          </div>

          <div>
            <h3 className="heading-font text-[48px] font-semibold text-black leading-none">
              99 +
            </h3>
            <p className="body-font mt-2 text-[20px] text-black">
              Events Covered
            </p>
          </div>

          <div>
            <h3 className="heading-font text-[48px] font-semibold text-black leading-none">
              99 +
            </h3>
            <p className="body-font mt-2 text-[20px] text-black">
              Visuals Match Accuracy
            </p>
          </div>

        </div>
      </div>

    </section>
  );
}