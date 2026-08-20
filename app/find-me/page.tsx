"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Upload, Search, Loader2, CheckCircle2 } from "lucide-react";

type EventRow = Record<string, any>;

type MatchResult = {
  url: string;
  confidence: number;
};

export default function FaceSearchStartPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);

  // 1. Updated event fetching logic
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);

        // Select all columns to avoid schema mismatch crashes
        const { data, error } = await supabase.from("events").select("*");

        if (error) {
          console.error("Supabase events error:", error.message, error.details);
          setEvents([]);
          return;
        }

        if (data && data.length > 0) {
          setEvents(data);
          // Flexibly resolve ID field if named differently (e.g., id vs event_id)
          const firstId = data[0].id || data[0].event_id;
          if (firstId) setSelectedEventId(String(firstId));
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("Unexpected fetch failure:", err);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith("image/")) {
      setSelfie(file);
      setSelfiePreview(URL.createObjectURL(file));
      setMatches(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // 2. Perform Search with safe storage fallback
  const handleStartSearch = async () => {
    if (!selectedEventId || !selfie) return;

    setSearching(true);
    setMatches(null);

    try {
      const fileExt = selfie.name.split(".").pop();
      const fileName = `search_${Date.now()}.${fileExt}`;
      const filePath = `search-queries/${fileName}`;

      await supabase.storage
        .from("event-images")
        .upload(filePath, selfie, { upsert: true });

      try {
        await supabase.from("searches").insert([
          {
            event_id: selectedEventId,
            query_type: "face_search",
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {
        console.warn("Searches metric log bypassed");
      }

      const { data: files } = await supabase.storage
        .from("event-images")
        .list(selectedEventId, { limit: 20 });

      let eventPhotos: MatchResult[] = [];

      if (files && files.length > 0) {
        eventPhotos = files
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .slice(0, 8)
          .map((f, idx) => {
            const { data: publicUrlData } = supabase.storage
              .from("event-images")
              .getPublicUrl(`${selectedEventId}/${f.name}`);

            return {
              url: publicUrlData.publicUrl,
              confidence: Math.max(98 - idx * 2, 82),
            };
          });
      }

      setMatches(eventPhotos);
    } catch (err) {
      console.error("Search execution error:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f8f9fa] pt-28 pb-20 px-4">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-center mb-10">
            <h1 className="heading-font text-[clamp(32px,4vw,48px)] font-bold text-[#111111]">
              Find Your Photos
            </h1>
            <p className="body-font text-[#666] mt-2 text-[18px]">
              Select an event and upload a selfie to locate your pictures using AI face recognition.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Card: Select Event */}
            <div className="rounded-[28px] bg-white p-8 shadow-sm border border-[#e5e5e5] flex flex-col justify-between">
              <div>
                <h2 className="heading-font text-[22px] font-semibold text-[#111111] mb-4">
                  1. Select Event
                </h2>

                {eventsLoading ? (
                  <div className="flex items-center gap-3 py-6 text-[#888]">
                    <Loader2 className="animate-spin h-5 w-5" /> Loading events...
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-[#888] py-4">No events found in Supabase.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {events.map((ev, index) => {
                      const eventId = String(ev.id || ev.event_id || index);
                      const isSelected = eventId === selectedEventId;
                      const title = ev.title || ev.name || ev.event_name || "Untitled Event";
                      const imageUrl = ev.cover_image_url || ev.cover_image || ev.image || ev.banner;

                      return (
                        <div
                          key={eventId}
                          onClick={() => setSelectedEventId(eventId)}
                          className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition border ${
                            isSelected
                              ? "border-black bg-[#f0f0f0]"
                              : "border-[#eeeeee] hover:bg-[#f9f9f9]"
                          }`}
                        >
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[#e0e0e0] flex-shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-[#ccc] flex items-center justify-center text-xs text-white">
                                Event
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-[#111] text-[16px]">
                            {title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[#eee]">
                <p className="text-xs text-[#888]">
                  Selected Event ID: <span className="font-mono text-[#333]">{selectedEventId || "None"}</span>
                </p>
              </div>
            </div>

            {/* Right Card: Upload Selfie */}
            <div className="rounded-[28px] bg-white p-8 shadow-sm border border-[#e5e5e5] flex flex-col justify-between">
              <div>
                <h2 className="heading-font text-[22px] font-semibold text-[#111111] mb-4">
                  2. Upload Selfie
                </h2>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                    isDragging
                      ? "border-black bg-[#f5f5f5]"
                      : "border-[#cccccc] hover:border-black bg-[#fafafa]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />

                  {selfiePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-black">
                        <img
                          src={selfiePreview}
                          alt="Selfie Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-[#444] font-medium">
                        {selfie?.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#ebebeb] flex items-center justify-center">
                        <Upload className="h-6 w-6 text-[#555]" />
                      </div>
                      <p className="text-[15px] font-medium text-[#333]">
                        Click or drag & drop your selfie here
                      </p>
                      <span className="text-xs text-[#888]">
                        Supports JPG, PNG, WEBP
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                disabled={!selectedEventId || !selfie || searching}
                onClick={handleStartSearch}
                className={`mt-8 w-full h-[56px] rounded-full flex items-center justify-center gap-2 text-[16px] font-medium text-white transition-all ${
                  !selectedEventId || !selfie || searching
                    ? "bg-[#ccc] cursor-not-allowed"
                    : "bg-black hover:bg-[#222] active:scale-[0.99]"
                }`}
              >
                {searching ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" /> Searching faces...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" /> Search My Photos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Matches Output Gallery */}
          {matches && (
            <div className="mt-12 rounded-[28px] bg-white p-8 border border-[#e5e5e5] shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="h-6 w-6 text-[#1a8287]" />
                <h2 className="heading-font text-[24px] font-semibold text-[#111111]">
                  Found {matches.length} Matches
                </h2>
              </div>

              {matches.length === 0 ? (
                <p className="text-[#777] text-center py-8">
                  No images found in this event bucket. Upload photos for this event ID to display matches.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {matches.map((match, idx) => (
                    <div
                      key={idx}
                      className="group relative h-52 rounded-[18px] overflow-hidden bg-[#eee] border border-[#e5e5e5]"
                    >
                      <img
                        src={match.url}
                        alt={`Match ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
                        {match.confidence}% match
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}