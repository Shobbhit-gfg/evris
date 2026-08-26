"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Upload, Search, Loader2, CheckCircle2 } from "lucide-react";
import { getFaceEmbeddingFromServer } from "@/lib/api/extractFace";

type EventRow = {
  id: string;
  title?: string;
  name?: string;
  event_name?: string;
  cover_image_url?: string;
  cover_image?: string;
  image?: string;
  banner?: string;
  [key: string]: any;
};

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

  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    null
  );

  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [searching, setSearching] = useState(false);

  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // ============================================================
  // LOAD EVENTS
  // ============================================================

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("event_date", { ascending: false });

        if (error) {
          console.error("❌ Supabase events error:", error);
          setEvents([]);
          setStatusMessage("Unable to load events.");
          return;
        }

        if (data && data.length > 0) {
          const validEvents = data.filter((event) => event.id);

          setEvents(validEvents);

          // Select first event automatically
          if (validEvents.length > 0) {
            setSelectedEventId(String(validEvents[0].id));
          }
        } else {
          setEvents([]);
          setSelectedEventId(null);
        }
      } catch (err) {
        console.error("❌ Unexpected event fetch failure:", err);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // ============================================================
  // HANDLE FILE
  // ============================================================

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please upload a valid image file.");
      return;
    }

    // Clean previous preview
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelfie(file);
    setSelfiePreview(previewUrl);

    // Clear old search results
    setMatches(null);
    setStatusMessage("");
  };

  // ============================================================
  // DRAG & DROP
  // ============================================================

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    handleFile(file);
  };

  // ============================================================
  // SELECT EVENT
  // ============================================================

  const handleEventSelect = (eventId: string) => {
    // Convert everything to string for consistent comparison
    const normalizedEventId = String(eventId);

    setSelectedEventId(normalizedEventId);

    // IMPORTANT:
    // Results from previous event must never remain visible
    setMatches(null);
    setStatusMessage("");

    console.log("📌 Selected Event ID:", normalizedEventId);
  };

  // ============================================================
  // AI FACE SEARCH
  // ============================================================

  const handleStartSearch = async () => {
    // ------------------------------------------------------------
    // VALIDATION
    // ------------------------------------------------------------

    if (!selectedEventId) {
      setStatusMessage("Please select an event first.");
      return;
    }

    if (!selfie) {
      setStatusMessage("Please upload a selfie first.");
      return;
    }

    if (searching) {
      return;
    }

    // ------------------------------------------------------------
    // START SEARCH
    // ------------------------------------------------------------

    setSearching(true);
    setMatches(null);

    setStatusMessage(
      "Extracting face vector via Python AI engine..."
    );

    try {
      // ==========================================================
      // STEP 1
      // Extract 512-dimensional ArcFace embedding
      // ==========================================================

      console.log("====================================");
      console.log("🧠 FACE SEARCH STARTED");
      console.log("====================================");

      console.log("📌 Event ID:", selectedEventId);
      console.log("📷 Selfie:", selfie.name);

      const queryVector = await getFaceEmbeddingFromServer(selfie);

      // ==========================================================
      // VALIDATE FACE EMBEDDING
      // ==========================================================

      if (!queryVector) {
        setStatusMessage(
          "No face vector was generated. Please upload a clearer selfie."
        );
        return;
      }

      if (queryVector.length !== 512) {
        console.error(
          "❌ Invalid embedding dimension:",
          queryVector.length
        );

        setStatusMessage(
          "Invalid face embedding. Please upload another selfie."
        );

        return;
      }

      console.log("✅ Face vector received");
      console.log("📐 Vector dimensions:", queryVector.length);

      // ==========================================================
      // STEP 2
      // SEARCH SUPABASE VECTOR DATABASE
      // ==========================================================

      setStatusMessage("Searching photos for your face...");

      console.log("------------------------------------");
      console.log("🔎 VECTOR SEARCH");
      console.log("------------------------------------");

      console.log("Event filter:", selectedEventId);
      console.log("Threshold:", 0.27);
      console.log("Match count:", 30);

      const { data, error } = await supabase.rpc("match_faces", {
        query_embedding: queryVector,

        // SAME THRESHOLD AS EVENT PAGE
        match_threshold: 0.27,

        // SAME RESULT LIMIT AS EVENT PAGE
        match_count: 30,

        // CRITICAL:
        // Search ONLY inside selected event
        filter_event_id: selectedEventId,
      });

      // ==========================================================
      // RPC ERROR
      // ==========================================================

      if (error) {
        console.error("❌ Search RPC Error:", error);

        setStatusMessage(
          `Database search failed: ${error.message}`
        );

        return;
      }

      console.log("✅ RPC search completed");

      console.log("Raw RPC results:", data);

      // ==========================================================
      // STEP 3
      // NORMALIZE RESULTS
      // ==========================================================

      const foundMatches: MatchResult[] = (data || [])
        .map((match: any) => ({
          id: String(match.id),
          event_id: String(match.event_id),
          image_url: match.image_url,
          similarity: Number(match.similarity),
        }))
        // Safety check:
        // Never display a photo from another event.
        .filter(
          (match: MatchResult) =>
            String(match.event_id) === String(selectedEventId)
        );

      // ==========================================================
      // SORT BY SIMILARITY
      // ==========================================================

      foundMatches.sort(
        (a, b) => b.similarity - a.similarity
      );

      console.log("------------------------------------");
      console.log("🎯 FINAL MATCHES");
      console.log("------------------------------------");

      console.log("Selected event:", selectedEventId);
      console.log("Total matches:", foundMatches.length);

      foundMatches.forEach((match, index) => {
        console.log(
          `${index + 1}. ${(
            match.similarity * 100
          ).toFixed(2)}%`,
          match.image_url
        );
      });

      // ==========================================================
      // STEP 4
      // STORE RESULTS
      // ==========================================================

      setMatches(foundMatches);

      // ==========================================================
      // STATUS
      // ==========================================================

      if (foundMatches.length > 0) {
        setStatusMessage(
          `Found ${foundMatches.length} matching photos in this event.`
        );
      } else {
        setStatusMessage(
          "No matching photos found in this event."
        );
      }
    } catch (err: any) {
      console.error(
        "❌ Face search execution error:",
        err
      );

      setStatusMessage(
        err?.message ||
          "Unable to process your selfie. Please try another photo."
      );
    } finally {
      setSearching(false);

      console.log("====================================");
      console.log("🏁 FACE SEARCH FINISHED");
      console.log("====================================");
    }
  };

  // ============================================================
  // RESET SEARCH
  // ============================================================

  const handleReset = () => {
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
    }

    setSelfie(null);
    setSelfiePreview(null);
    setMatches(null);
    setStatusMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f8f9fa] pt-28 pb-20 px-4">
        <div className="mx-auto max-w-[1100px]">

          {/* ======================================================
              HEADER
          ====================================================== */}

          <div className="text-center mb-10">
            <h1 className="heading-font text-[clamp(32px,4vw,48px)] font-bold text-[#111111]">
              Find Your Photos
            </h1>

            <p className="body-font text-[#666] mt-2 text-[18px]">
              Select an event and upload a selfie to locate your
              pictures using Python AI face recognition.
            </p>
          </div>

          {/* ======================================================
              MAIN SEARCH AREA
          ====================================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ====================================================
                EVENT SELECTOR
            ==================================================== */}

            <div className="rounded-[28px] bg-white p-8 shadow-sm border border-[#e5e5e5] flex flex-col justify-between">

              <div>

                <h2 className="heading-font text-[22px] font-semibold text-[#111111] mb-4">
                  1. Select Event
                </h2>

                {eventsLoading ? (

                  <div className="flex items-center gap-3 py-6 text-[#888]">
                    <Loader2 className="animate-spin h-5 w-5" />
                    Loading events...
                  </div>

                ) : events.length === 0 ? (

                  <p className="text-[#888] py-4">
                    No events found in Supabase.
                  </p>

                ) : (

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">

                    {events.map((ev) => {

                      const eventId = String(ev.id);

                      const isSelected =
                        eventId === selectedEventId;

                      const title =
                        ev.title ||
                        ev.name ||
                        ev.event_name ||
                        "Untitled Event";

                      const imageUrl =
                        ev.cover_image_url ||
                        ev.cover_image ||
                        ev.image ||
                        ev.banner;

                      return (

                        <div
                          key={eventId}
                          onClick={() =>
                            handleEventSelect(eventId)
                          }
                          className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition border ${
                            isSelected
                              ? "border-black bg-[#f0f0f0]"
                              : "border-[#eeeeee] hover:bg-[#f9f9f9]"
                          }`}
                        >

                          {/* EVENT IMAGE */}

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

                          {/* EVENT NAME */}

                          <span className="font-medium text-[#111] text-[16px]">
                            {title}
                          </span>

                        </div>

                      );
                    })}

                  </div>

                )}

              </div>

              {/* SELECTED EVENT */}

              <div className="mt-8 pt-6 border-t border-[#eee]">

                <p className="text-xs text-[#888]">

                  Selected Event ID:

                  <span className="font-mono text-[#333] ml-1">
                    {selectedEventId || "None"}
                  </span>

                </p>

              </div>

            </div>

            {/* ====================================================
                SELFIE UPLOAD
            ==================================================== */}

            <div className="rounded-[28px] bg-white p-8 shadow-sm border border-[#e5e5e5] flex flex-col justify-between">

              <div>

                <h2 className="heading-font text-[22px] font-semibold text-[#111111] mb-4">
                  2. Upload Selfie
                </h2>

                {/* UPLOAD BOX */}

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() =>
                    setIsDragging(false)
                  }
                  onDrop={handleDrop}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                    isDragging
                      ? "border-black bg-[#f5f5f5]"
                      : "border-[#cccccc] hover:border-black bg-[#fafafa]"
                  }`}
                >

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handleFile(e.target.files?.[0])
                    }
                  />

                  {selfiePreview ? (

                    <div className="flex flex-col items-center gap-3">

                      <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-black shadow-sm">

                        <img
                          src={selfiePreview}
                          alt="Selfie Preview"
                          className="h-full w-full object-cover"
                        />

                      </div>

                      <span className="text-sm text-[#444] font-medium">
                        {selfie?.name}
                      </span>

                      <span className="text-xs text-[#30bcc3]">
                        Click to change photo
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

              {/* SEARCH BUTTON */}

              <div>

                <button
                  disabled={
                    !selectedEventId ||
                    !selfie ||
                    searching
                  }
                  onClick={handleStartSearch}
                  className={`mt-8 w-full h-[56px] rounded-full flex items-center justify-center gap-2 text-[16px] font-medium text-white transition-all ${
                    !selectedEventId ||
                    !selfie ||
                    searching
                      ? "bg-[#ccc] cursor-not-allowed"
                      : "bg-black hover:bg-[#222] active:scale-[0.99]"
                  }`}
                >

                  {searching ? (

                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Processing AI Search...
                    </>

                  ) : (

                    <>
                      <Search className="h-5 w-5" />
                      Search My Photos
                    </>

                  )}

                </button>

                {/* STATUS */}

                {statusMessage && (

                  <p className="text-center text-xs text-[#666] mt-3 font-medium">
                    {statusMessage}
                  </p>

                )}

              </div>

            </div>

          </div>

          {/* ======================================================
              MATCH RESULTS
          ====================================================== */}

          {matches !== null && (

            <div className="mt-12 rounded-[28px] bg-white p-8 border border-[#e5e5e5] shadow-sm">

              {/* RESULT HEADER */}

              <div className="flex items-center justify-between mb-6">

                <div className="flex items-center gap-2">

                  <CheckCircle2 className="h-6 w-6 text-[#1a8287]" />

                  <h2 className="heading-font text-[24px] font-semibold text-[#111111]">
                    Found {matches.length} Matches
                  </h2>

                </div>

                <button
                  onClick={handleReset}
                  className="text-sm underline text-[#666] hover:text-black font-medium"
                >
                  Reset Search
                </button>

              </div>

              {/* RESULTS */}

              {matches.length === 0 ? (

                <p className="text-[#777] text-center py-8">
                  No matching faces found in this event.
                  Try uploading a clearer selfie.
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

                      {/* SIMILARITY */}

                      <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
                        {(match.similarity * 100).toFixed(1)}%
                        similarity
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