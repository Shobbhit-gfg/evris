"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const categoryColors: Record<string, string> = {
  Seminar: "#30bcc3",
  Workshop: "#1a8287",
  Cultural: "#1a8287",
  Fest: "#123c3e",
};

type EventRow = {
  id: string;
  title: string;
  category?: string;
  event_date?: string;
  location?: string;
  description?: string;
  cover_image_url?: string;
  cover_image?: string;
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<{ url: string; confidence: number }[] | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) console.error("Fetch event error:", error);
      setEvent(data);
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    const fetchPhotos = async () => {
      setPhotosLoading(true);

      const { data, error } = await supabase.storage
        .from("event-images")
        .list(id, { sortBy: { column: "name", order: "asc" } });

      if (error) {
        console.error("Fetch photos error:", error);
        setPhotosLoading(false);
        return;
      }

      const files = (data || []).filter((f) => f.name && !f.name.startsWith("."));

      const urls = files.map((file) => {
        const { data: publicUrlData } = supabase.storage
          .from("event-images")
          .getPublicUrl(`${id}/${file.name}`);
        return publicUrlData.publicUrl;
      });

      setPhotos(urls);
      setPhotosLoading(false);
    };

    fetchPhotos();
  }, [id]);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith("image/")) setSelfie(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSearch = () => {
    if (!selfie) {
      fileInputRef.current?.click();
      return;
    }
    setSearching(true);
    setTimeout(() => {
      const sample = photos.slice(0, 4);
      setMatches(
        sample.map((url, i) => ({
          url,
          confidence: [98, 96, 95, 93][i] ?? 90,
        }))
      );
      setSearching(false);
    }, 1200);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center pt-20">
          <p className="body-font text-[18px] text-[#737378]">Loading event...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 pt-20">
          <p className="body-font text-[20px] text-[#737378]">Event not found.</p>
          <Link href="/events" className="body-font text-[16px] font-medium text-black underline">
            Back to All Events
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const catColor = categoryColors[event.category || ""] || "#30bcc3";
  const cover = event.cover_image_url?.trim() || event.cover_image?.trim() || photos[0] || "/gallery/gallery1.webp";
  const visiblePhotos = photos.slice(0, 7);
  const remainingCount = photos.length - visiblePhotos.length;

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4 pb-20">
          <div className="mx-auto mt-8 w-full max-w-[1174px]">

            <Link href="/events" className="body-font text-[16px] font-medium text-[#66666b] transition hover:text-black">
              ← All Events
            </Link>

            <div className="mt-8 flex items-center">
              <span
                className="body-font rounded-full px-4 py-2 text-[14px] font-medium text-white"
                style={{ backgroundColor: catColor }}
              >
                {event.category || "Event"}
              </span>
            </div>

            <h1 className="heading-font mt-4 text-[clamp(36px,5.5vw,56px)] font-semibold text-[#111111]">
              {event.title}
            </h1>

            <p className="body-font mt-4 text-[18px] text-[#737378]">
              {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date"}
              {event.location && <> &nbsp;•&nbsp; {event.location}</>}
              {photos.length > 0 && <> &nbsp;•&nbsp; {photos.length} photos</>}
            </p>

            <div className="relative mt-8 h-[420px] w-full overflow-hidden rounded-[32px] bg-[#eaeaea]">
              <Image src={cover} alt={event.title} fill className="object-cover" />
            </div>

            {/* Face Search Card */}
            <div className="mt-10 rounded-[44px] bg-[#111111] p-10 md:p-14">
              <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
                <div className="max-w-[520px]">
                  <span className="body-font inline-flex items-center gap-2 rounded-full bg-[rgba(48,188,195,0.2)] px-4 py-2 text-[14px] text-[#30bcc3]">
                    <span className="h-2 w-2 rounded-full bg-[#30bcc3]" />
                    AI Face Search
                  </span>
                  <h2 className="heading-font mt-4 text-[36px] font-semibold text-white">
                    Find Your Photos
                  </h2>
                  <p className="body-font mt-4 text-[17px] text-[#bfbfc2]">
                    Upload a selfie and we&apos;ll scan every photo uploaded from this event to find every shot you&apos;re in — instantly.
                  </p>
                  <button
                    onClick={handleSearch}
                    disabled={searching || photos.length === 0}
                    className="body-font mt-8 flex h-[60px] items-center justify-center rounded-full bg-[#30bcc3] px-8 text-[18px] font-semibold text-[#111111] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                  >
                    {searching ? "Searching..." : "Upload Selfie & Search"}
                  </button>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    flex h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-3
                    rounded-[28px] border-[1.5px] border-dashed bg-white/[0.06] transition-colors md:w-[420px]
                    ${isDragging ? "border-white/60 bg-white/10" : "border-white/25"}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  {selfie ? (
                    <>
                      <div className="relative h-[64px] w-[64px] overflow-hidden rounded-full">
                        <Image src={URL.createObjectURL(selfie)} alt="Selfie preview" fill className="object-cover" />
                      </div>
                      <p className="body-font text-[14px] text-[#d9d9db]">{selfie.name}</p>
                    </>
                  ) : (
                    <>
                      <div className="h-[64px] w-[64px] rounded-full bg-[#30bcc3]" />
                      <p className="body-font text-[16px] text-[#d9d9db]">Drag & drop your selfie here</p>
                      <p className="body-font text-[14px] text-[#99999e]">or click to browse</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* All Uploaded Photos */}
            <h2 className="heading-font mt-16 text-[34px] font-semibold text-[#111111]">
              All Uploaded Photos
            </h2>
            <p className="body-font mt-2 text-[22px] text-[#808080]">
              {photosLoading ? "Loading photos..." : `${photos.length} photos uploaded for this event`}
            </p>

            <div className="mt-6 rounded-[44px] bg-[#eaeaea] p-10">
              {photosLoading ? (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[4/3] animate-pulse rounded-[20px] bg-[#d9d9d9]" />
                  ))}
                </div>
              ) : photos.length === 0 ? (
                <p className="body-font py-10 text-center text-[18px] text-[#8c8c8c]">
                  No photos uploaded for this event yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  {visiblePhotos.map((url, i) => (
                    <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#d9d9d9]">
                      <Image src={url} alt={`Event photo ${i + 1}`} fill className="object-cover" />
                      <a
                        href={url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
                      >
                        <Download className="h-[18px] w-[18px]" />
                      </a>
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <Link
                      href={`/events/${id}/gallery`}
                      className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[20px] bg-[rgba(26,130,135,0.55)] transition hover:bg-[rgba(26,130,135,0.7)]"
                    >
                      <span className="body-font text-[20px] font-semibold text-white">
                        +{remainingCount} more
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Matches */}
            {matches && (
              <>
                <div className="mt-16 flex items-center gap-4">
                  <h2 className="heading-font text-[34px] font-semibold text-[#111111]">
                    Your Matches
                  </h2>
                  <span className="body-font rounded-full bg-[#30bcc3] px-4 py-1 text-[15px] font-semibold text-white">
                    {matches.length} photos found
                  </span>
                </div>
                <p className="body-font mt-2 text-[24px] text-[#808080]">
                  AI face search identified you in these photos from {event.title}.
                </p>

                <div className="mt-6 rounded-[44px] border-[1.5px] border-[rgba(48,188,195,0.4)] bg-[rgba(48,188,195,0.08)] p-10">
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                    {matches.map((m, i) => (
                      <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#d9d9d9]">
                        <Image src={m.url} alt={`Match ${i + 1}`} fill className="object-cover" />
                        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#30bcc3] text-[16px] font-semibold text-white">
                          ✓
                        </span>
                        <a
                          href={m.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-[52px] flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
                        >
                          <Download className="h-[18px] w-[18px]" />
                        </a>
                        <span className="body-font absolute bottom-3 left-3 rounded-full bg-black/50 px-4 py-1 text-[13px] font-medium text-white">
                          {m.confidence}% match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button className="body-font flex h-[60px] items-center justify-center rounded-full bg-black px-8 text-[17px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
                    Download All Matches
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}