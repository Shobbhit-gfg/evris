"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const images = [
  "/gallerysection/1.jpg",
  "/gallerysection/2.jpg",
  "/gallerysection/3.jpg",
  "/gallerysection/4.jpg",
  "/gallerysection/5.jpg",
  "/gallery/gallery1.webp",
  "/gallery/gallery2.webp",
  "/gallery/gallery3.webp",
  "/gallery/gallery4.webp",
  "/gallery/gallery5.webp",
];

// The 5 physical slots, left to right, matching the Figma layout exactly.
const slots = [
  { left: 0, top: 101, width: 348, height: 471, z: 10 },   // far left
  { left: 145, top: 50, width: 449, height: 571, z: 20 },  // left
  { left: 434, top: 0, width: 528, height: 672, z: 30 },   // center (front)
  { left: 802, top: 50, width: 449, height: 571, z: 20 },  // right
  { left: 1027, top: 101, width: 369, height: 471, z: 10 }, // far right
];

export default function GalleryPage() {
  const [activeIndex, setActiveIndex] = useState(2); // start with the 3rd image centered
  const N = images.length;

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <section className="px-6 pt-16 pb-8">
          <div className="relative mx-auto h-[672px] w-[1396px] max-w-full overflow-hidden">
            {images.map((src, i) => {
              // Shortest circular distance from the active image (-N/2 .. N/2)
              let diff = i - activeIndex;
              diff = ((diff % N) + N) % N;
              if (diff > N / 2) diff -= N;

              const isVisible = Math.abs(diff) <= 2;
              const slot = isVisible ? slots[diff + 2] : diff < 0 ? slots[0] : slots[4];

              return (
                <motion.div
                  key={src}
                  onClick={() => isVisible && setActiveIndex(i)}
                  animate={{
                    left: isVisible ? slot.left : diff < 0 ? slot.left - 260 : slot.left + 260,
                    top: slot.top,
                    width: slot.width,
                    height: slot.height,
                    opacity: isVisible ? 1 : 0,
                    scale: isVisible ? 1 : 0.85,
                    zIndex: isVisible ? slot.z : 0,
                  }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={
                    isVisible
                      ? {
                          y: -12,
                          scale: 1.05,
                          zIndex: 999,
                          boxShadow: "0px 30px 60px rgba(0,0,0,0.3)",
                        }
                      : undefined
                  }
                  className={`
                    absolute overflow-hidden rounded-2xl bg-[#d9d9d9]
                    ${diff === 0 ? "shadow-[4px_13px_33.5px_3px_rgba(0,0,0,0.25)]" : "shadow-md"}
                    ${diff === 0 ? "cursor-default" : isVisible ? "cursor-pointer" : "pointer-events-none"}
                  `}
                >
                  <Image
                    src={src}
                    alt={`Gallery photo ${i + 1}`}
                    fill
                    className="object-cover"
                    priority={diff === 0}
                  />
                </motion.div>
              );
            })}
          </div>

          <h1 className="heading-font mt-16 text-center text-[72px] font-semibold text-[#111111]">
            Our Work
          </h1>
        </section>
      </main>

      <Footer />
    </>
  );
}