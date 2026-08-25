"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Upload, Search, Loader2, CheckCircle2 } from "lucide-react";
import { getFaceEmbeddingFromServer } from "@/lib/api/extractFace"; // 🐍 Python Microservice Import

type EventRow = Record<string, any>;

type MatchResult = {
  id: string;
  event_id: string;
  image_url: string;
  similarity: number;
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
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);

        const { data, error } = await supabase.from("events").select("*");

        if (error) {
          console.error("Supabase events error:", error.message, error.details);
          setEvents([]);
          return;
        }

        if (data && data.length > 0) {
          setEvents(data);
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
      setStatusMessage("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // 🐍 Real Python AI + Vector Database Search Execution
  const handleStartSearch = async () => {
    if (!selectedEventId || !selfie) {
      setStatusMessage("Please select an event and upload a selfie.");
      return;
    }

    setSearching(true);
    setMatches(null);
    setStatusMessage("Extracting face vector via Python AI engine...");

    try {
      // ==========================================
      // STEP 1: Extract 512-D ArcFace embedding
      // ==========================================
      const queryVector = await getFaceEmbeddingFromServer(selfie);

      if (!queryVector || queryVector.length !== 512) {
        setStatusMessage(
          "No valid face detected. Please upload a clearer selfie."
        );
        return;
      }

      console.log("✅ Query face vector received");
      console.log("Vector dimensions:", queryVector.length);

      setStatusMessage("Searching your photos...");

      // ==========================================
      // STEP 2: Search ONLY selected event
      // ==========================================
      console.log("🔎 Searching event:", selectedEventId);

      const { data, error } = await supabase.rpc("match_faces", {
        query_embedding: queryVector,
        match_threshold: 0.35,
        match_count: 20,
        filter_event_id: selectedEventId,
      });

      if (error) {
        console.error("❌ Search RPC Error:", error);

        setStatusMessage(
          `Database search failed: ${error.message}`
        );

        return;
      }

      console.log("✅ RPC search completed");
      console.log("Raw matches:", data);

      // ==========================================
      // STEP 3: Store results
      // ==========================================
      const foundMatches: MatchResult[] = (data || []).map((match: any) => ({
        id: match.id,
        event_id: match.event_id,
        image_url: match.image_url,
        similarity: Number(match.similarity),
      }));

      console.log("🎯 Final matches:", foundMatches);

      setMatches(foundMatches);

      if (foundMatches.length > 0) {
        setStatusMessage(
          `Found ${foundMatches.length} matching photos!`
        );
      } else {
        setStatusMessage(
          "No matching photos found for you in this event."
        );
      }
    } catch (err: any) {
      console.error("❌ Search execution error:", err);

      setStatusMessage(
        err?.message ||
          "Unable to process your selfie. Please try another photo."
      );
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
              Select an event and upload a selfie to locate your pictures using Python AI face recognition.
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

              <div>
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
                      <Loader2 className="animate-spin h-5 w-5" /> Processing AI Search...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" /> Search My Photos
                    </>
                  )}
                </button>

                {statusMessage && (
                  <p className="text-center text-xs text-[#666] mt-3 font-medium">
                    {statusMessage}
                  </p>
                )}
              </div>
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
                  No matching faces found in this event. Ensure event photos were uploaded with clear faces.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {matches.map((match, idx) => (
                    <div
                      key={match.id || idx}
                      className="group relative h-52 rounded-[18px] overflow-hidden bg-[#eee] border border-[#e5e5e5]"
                    >
                      <img
                        src={match.image_url}
                        alt={`Match ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
                        {(match.similarity * 100).toFixed(1)}% similarity
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