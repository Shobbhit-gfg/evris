import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import Hero from "@/components/sections/Hero";
import GalleryPreview from "@/components/sections/GalleryPreview";
import Features from "@/components/sections/Features";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="pt-20">
        <Hero />
        <GalleryPreview />
        <Features />
      </main>

      <Footer />
    </>
  );
}