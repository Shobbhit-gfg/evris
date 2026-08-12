"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="flex justify-center px-4 pt-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="
          w-full
          max-w-[905px]
          rounded-[clamp(20px,3vw,34px)]
          bg-[rgba(217,217,217,0.2)]
          shadow-[0px_20px_60px_rgba(76,23,23,0.15)]
          px-[clamp(24px,6vw,64px)]
          py-[clamp(32px,5vw,56px)]
        "
      >
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="heading-font text-[clamp(32px,5.5vw,72px)] leading-[1.1] font-semibold text-[#111111] text-center"
        >
          AI-Powered Event
          <br />
          Photography Platform
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="body-font mt-[clamp(16px,3vw,24px)] text-[clamp(15px,1.6vw,20px)] text-[#6e6e73] text-center"
        >
          Find your photos instantly , Organize events effortlessly , Preserve every memory.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
          className="mt-[clamp(20px,3vw,32px)] flex flex-wrap justify-center gap-[clamp(12px,2vw,19px)]"
        >
          <Link
            href="/gallery"
            className="
              body-font
              flex
              h-[clamp(48px,6vw,56px)]
              min-w-[clamp(160px,20vw,200px)]
              items-center
              justify-center
              rounded-full
              border
              border-black
              bg-white
              px-[clamp(16px,2vw,24px)]
              text-[clamp(15px,1.6vw,20px)]
              font-medium
              text-black
              transition-all
              duration-300
              ease-out
              hover:bg-black
              hover:text-white
              hover:-translate-y-1
              hover:shadow-lg
              active:scale-[0.98]
            "
          >
            Explore Gallery
          </Link>

          <Link
            href="/events"
            className="
              body-font
              flex
              h-[clamp(48px,6vw,56px)]
              min-w-[clamp(160px,20vw,200px)]
              items-center
              justify-center
              rounded-full
              border
              border-black
              bg-white
              px-[clamp(16px,2vw,24px)]
              text-[clamp(15px,1.6vw,20px)]
              font-medium
              text-black
              transition-all
              duration-300
              ease-out
              hover:bg-black
              hover:text-white
              hover:-translate-y-1
              hover:shadow-lg
              active:scale-[0.98]
            "
          >
            Event & Workshop
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}