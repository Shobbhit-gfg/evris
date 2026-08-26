"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { getFaceEmbeddingFromServer } from "@/lib/api/extractFace";

type MatchResult = {
  id: string;
  event_id: string;
  image_url: string;
  similarity: number;
};

type EventData = {
  id: string;
  title: string;
  category?: string;
  event_date?: string;
  location?: string;
  cover_image_url?: string;
  cover_image?: string;
};

export default function SingleEventPage() {
  const params = useParams();

  /*
   * ============================================================
   * EVENT ID
   * ============================================================
   */

  const rawEventId = params?.id;

  const eventId =
    typeof rawEventId === "string"
      ? rawEventId.trim()
      : Array.isArray(rawEventId)
      ? rawEventId[0]?.trim()
      : "";

  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * ============================================================
   * EVENT STATE
   * ============================================================
   */

  const [event, setEvent] = useState<EventData | null>(null);
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(true);

  /*
   * ============================================================
   * FACE SEARCH STATE
   * ============================================================
   */

  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(
    null
  );

  const [isDragging, setIsDragging] = useState(false);
  const [searching, setSearching] = useState(false);

  const [matches, setMatches] = useState<MatchResult[] | null>(
    null
  );

  const [statusMessage, setStatusMessage] = useState("");

  /*
   * ============================================================
   * FACE SEARCH CONFIGURATION
   * ============================================================
   *
   * Keep these values the same as Find-Me.
   */

  const MATCH_THRESHOLD = 0.35;
  const MATCH_COUNT = 100;

  /*
   * ============================================================
   * FETCH EVENT + PHOTOS
   * ============================================================
   */

  useEffect(() => {
    if (!eventId) {
      console.error("❌ No event ID found in URL");
      setLoadingEvent(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingEvent(true);

        console.log("========================================");
        console.log("📌 EVENT PAGE");
        console.log("Event ID:", eventId);
        console.log("========================================");

        /*
         * --------------------------------------------------------
         * 1. FETCH EVENT
         * --------------------------------------------------------
         */

        const {
          data: eventData,
          error: eventError,
        } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) {
          console.error(
            "❌ Event fetch error:",
            eventError.message,
            eventError.details
          );

          setEvent(null);
        } else if (eventData) {
          console.log("✅ Event loaded:", eventData);

          setEvent(eventData);
        }

        /*
         * --------------------------------------------------------
         * 2. FETCH EVENT PHOTOS
         * --------------------------------------------------------
         *
         * IMPORTANT:
         *
         * Your photos table does NOT contain created_at.
         *
         * Therefore DO NOT use:
         *
         * .order("created_at")
         *
         * We simply fetch the photos belonging to this event.
         */

        const {
          data: photoData,
          error: photoError,
        } = await supabase
          .from("photos")
          .select("*")
          .eq("event_id", eventId);

        if (photoError) {
          console.error(
            "❌ Photos fetch error:",
            photoError.message,
            photoError.details
          );

          setAllPhotos([]);
        } else {
          console.log(
            `✅ Loaded ${photoData?.length || 0} event photos`
          );

          setAllPhotos(photoData || []);
        }
      } catch (error) {
        console.error(
          "❌ Event page fetch error:",
          error
        );
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchData();
  }, [eventId]);

  /*
   * ============================================================
   * FILE HANDLING
   * ============================================================
   */

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    /*
     * Validate image
     */

    if (!file.type.startsWith("image/")) {
      setStatusMessage(
        "Please upload a valid image file."
      );
      return;
    }

    /*
     * Revoke previous preview URL
     * to prevent memory leaks.
     */

    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelfie(file);
    setSelfiePreview(previewUrl);

    /*
     * Clear previous results
     */

    setMatches(null);
    setStatusMessage("");
  };

  /*
   * ============================================================
   * DRAG & DROP
   * ============================================================
   */

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    handleFile(file);
  };

  /*
   * ============================================================
   * FACE SEARCH
   * ============================================================
   */

  const handleStartSearch = async () => {
    if (!eventId) {
      setStatusMessage(
        "Invalid event. Please open the event again."
      );
      return;
    }

    if (!selfie) {
      setStatusMessage(
        "Please upload a selfie to search."
      );
      return;
    }

    if (searching) {
      return;
    }

    /*
     * Start searching
     */

    setSearching(true);
    setMatches(null);

    setStatusMessage(
      "Extracting face vector via Python AI engine..."
    );

    try {
      console.log("");
      console.log("========================================");
      console.log("🔎 STARTING EVENT FACE SEARCH");
      console.log("========================================");

      console.log("📌 Event ID:", eventId);
      console.log(
        "📌 Match threshold:",
        MATCH_THRESHOLD
      );
      console.log(
        "📌 Match count:",
        MATCH_COUNT
      );
      console.log("📌 Selfie:", selfie.name);

      /*
       * ========================================================
       * STEP 1
       * Extract 512-dimensional ArcFace embedding
       * ========================================================
       */

      console.log(
        "🧠 STEP 1: Extracting face embedding..."
      );

      const queryVector =
        await getFaceEmbeddingFromServer(selfie);

      /*
       * Check face detection
       */

      if (!queryVector) {
        setStatusMessage(
          "No face detected. Please upload a clearer selfie."
        );
        return;
      }

      /*
       * Check embedding dimensions
       */

      if (queryVector.length !== 512) {
        console.error(
          "❌ Invalid embedding dimensions:",
          queryVector.length
        );

        setStatusMessage(
          "Invalid face vector. Please upload another selfie."
        );

        return;
      }

      console.log(
        "✅ Face embedding extracted"
      );

      console.log(
        "📐 Vector dimensions:",
        queryVector.length
      );

      /*
       * ========================================================
       * STEP 2
       * Search pgvector using match_faces RPC
       * ========================================================
       */

      setStatusMessage(
        "Searching this event's photos..."
      );

      console.log("");
      console.log(
        "🔎 STEP 2: Vector search"
      );
      console.log("----------------------------------------");
      console.log(
        "RPC: match_faces"
      );
      console.log(
        "Event ID:",
        eventId
      );
      console.log(
        "Threshold:",
        MATCH_THRESHOLD
      );
      console.log(
        "Count:",
        MATCH_COUNT
      );
      console.log("----------------------------------------");

      const {
        data,
        error,
      } = await supabase.rpc(
        "match_faces",
        {
          query_embedding: queryVector,

          match_threshold:
            MATCH_THRESHOLD,

          match_count:
            MATCH_COUNT,

          /*
           * Search ONLY the current event.
           */
          filter_event_id:
            eventId,
        }
      );

      /*
       * ========================================================
       * RPC ERROR
       * ========================================================
       */

      if (error) {
        console.error("");
        console.error(
          "❌ RPC SEARCH ERROR"
        );
        console.error(
          "Message:",
          error.message
        );
        console.error(
          "Details:",
          error.details
        );
        console.error(
          "Hint:",
          error.hint
        );
        console.error(
          "Code:",
          error.code
        );

        setStatusMessage(
          `Database search failed: ${error.message}`
        );

        return;
      }

      /*
       * ========================================================
       * STEP 3
       * PROCESS RESULTS
       * ========================================================
       */

      console.log("");
      console.log(
        "✅ RPC SEARCH COMPLETED"
      );

      console.log(
        "Raw results:",
        data
      );

      console.log(
        `📊 Raw match count: ${
          data?.length || 0
        }`
      );

      /*
       * Convert database results
       */

      const foundMatches: MatchResult[] =
        (data || [])
          .map((match: any) => ({
            id: String(match.id),
            event_id: String(
              match.event_id
            ),
            image_url:
              match.image_url,
            similarity:
              Number(
                match.similarity
              ),
          }))
          .filter(
            (match: MatchResult) =>
              Boolean(match.id) &&
              Boolean(match.image_url) &&
              Number.isFinite(
                match.similarity
              )
          );

      /*
       * Sort from highest similarity
       * to lowest similarity.
       */

      foundMatches.sort(
        (a, b) =>
          b.similarity -
          a.similarity
      );

      /*
       * Debug
       */

      console.log("");
      console.log(
        "========================================"
      );
      console.log(
        "🎯 FINAL EVENT MATCHES"
      );
      console.log(
        "========================================"
      );

      console.log(
        `Total valid matches: ${foundMatches.length}`
      );

      foundMatches.forEach(
        (match, index) => {
          console.log(
            `${index + 1}. ${(
              match.similarity * 100
            ).toFixed(
              2
            )}% | ${match.image_url}`
          );
        }
      );

      console.log(
        "========================================"
      );

      /*
       * Save results
       */

      setMatches(foundMatches);

      /*
       * Status
       */

      if (
        foundMatches.length > 0
      ) {
        setStatusMessage(
          `Found ${foundMatches.length} matching photos!`
        );
      } else {
        setStatusMessage(
          "No matching photos found for you in this event."
        );
      }
    } catch (error: any) {
      console.error("");
      console.error(
        "❌ FACE SEARCH FAILED"
      );
      console.error(error);

      setStatusMessage(
        error?.message ||
          "Unable to process your selfie. Please try another photo."
      );
    } finally {
      setSearching(false);
    }
  };

  /*
   * ============================================================
   * RESET SEARCH
   * ============================================================
   */

  const resetSearch = () => {
    if (selfiePreview) {
      URL.revokeObjectURL(
        selfiePreview
      );
    }

    setMatches(null);
    setSelfie(null);
    setSelfiePreview(null);
    setStatusMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loadingEvent) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#f8f9fa] pt-40 text-center">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-4 text-[#737378]" />

          <p className="text-lg text-[#737378]">
            Loading event details...
          </p>
        </main>

        <Footer />
      </>
    );
  }

  /*
   * ============================================================
   * EVENT NOT FOUND
   * ============================================================
   */

  if (!event) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#f8f9fa] pt-40 text-center">
          <p className="text-lg text-red-500">
            Event not found.
          </p>

          <Link
            href="/events"
            className="inline-block mt-4 underline text-[#111]"
          >
            Back to Events
          </Link>
        </main>

        <Footer />
      </>
    );
  }

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-24 pb-20 px-6 bg-[#f8f9fa]">
        <div className="mx-auto max-w-[1000px]">

          {/* ================================================== */}
          {/* BACK TO EVENTS */}
          {/* ================================================== */}

          <Link
            href="/events"
            className="flex items-center gap-2 text-[#737378] hover:text-black transition w-fit mb-6"
          >
            <ArrowLeft className="w-4 h-4" />

            <span className="font-medium text-[14px]">
              All Events
            </span>
          </Link>

          {/* ================================================== */}
          {/* CATEGORY */}
          {/* ================================================== */}

          <span className="bg-[#123c3e] text-[#30bcc3] px-3 py-1 rounded-full text-[12px] font-semibold mb-4 inline-block">
            {event.category || "Event"}
          </span>

          {/* ================================================== */}
          {/* TITLE */}
          {/* ================================================== */}

          <h1 className="text-4xl md:text-[44px] font-semibold text-[#111] mb-2">
            {event.title}
          </h1>

          {/* ================================================== */}
          {/* EVENT META */}
          {/* ================================================== */}

          <p className="text-[#737378] text-[15px] mb-8">
            {event.event_date
              ? new Date(
                  event.event_date
                ).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )
              : "Date unavailable"}

            {" • "}

            {event.location ||
              "Location unavailable"}

            {" • "}

            {allPhotos.length} photos
          </p>

          {/* ================================================== */}
          {/* HERO IMAGE */}
          {/* ================================================== */}

          <div className="relative h-[250px] md:h-[350px] w-full rounded-[24px] overflow-hidden mb-12 shadow-md">
            <Image
              src={
                event.cover_image_url?.trim() ||
                event.cover_image?.trim() ||
                "/gallery/gallery1.webp"
              }
              alt={
                event.title ||
                "Event"
              }
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* ================================================== */}
          {/* FACIAL SEARCH CARD */}
          {/* ================================================== */}

          <div className="bg-white rounded-[32px] p-8 md:p-10 mb-16 border border-[#e5e5e5] shadow-sm">

            {/* SEARCH HEADER */}

            <div className="max-w-xl mx-auto text-center mb-8">

              <span className="inline-flex items-center gap-1.5 bg-[#f0f0f0] text-[#111] px-3.5 py-1.5 rounded-full text-[12px] font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#30bcc3]" />

                AI Face Search
              </span>

              <h2 className="text-[30px] font-semibold text-[#111] mb-2">
                Find Your Photos
              </h2>

              <p className="text-[#666] text-[15px]">
                Upload a selfie and our
                Python AI engine will scan
                this event to find every photo
                you appear in.
              </p>
            </div>

            {/* ================================================== */}
            {/* UPLOAD AREA */}
            {/* ================================================== */}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => {
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className={`border-2 border-dashed rounded-[24px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] max-w-xl mx-auto mb-6 ${
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
                onChange={(e) => {
                  handleFile(
                    e.target.files?.[0]
                  );

                  /*
                   * Allow same image
                   * to be selected again.
                   */
                  e.target.value = "";
                }}
              />

              {selfiePreview ? (
                <div className="flex flex-col items-center gap-3">

                  <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-black shadow-md">
                    <img
                      src={selfiePreview}
                      alt="Selfie Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <span className="text-sm text-[#444] font-medium">
                    {selfie?.name}
                  </span>

                  <span className="text-xs text-[#30bcc3] underline">
                    Click to change photo
                  </span>

                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">

                  <div className="h-12 w-12 rounded-full bg-[#ebebeb] flex items-center justify-center">
                    <Upload className="h-6 w-6 text-[#555]" />
                  </div>

                  <p className="text-[15px] font-medium text-[#333]">
                    Click or drag & drop your
                    selfie here
                  </p>

                  <span className="text-xs text-[#888]">
                    Supports JPG, PNG, WEBP
                  </span>

                </div>
              )}
            </div>

            {/* ================================================== */}
            {/* SEARCH BUTTON */}
            {/* ================================================== */}

            <div className="max-w-xl mx-auto">

              <button
                disabled={!selfie || searching}
                onClick={handleStartSearch}
                className={`w-full h-[54px] rounded-full flex items-center justify-center gap-2 text-[16px] font-medium text-white transition-all ${
                  !selfie || searching
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
                    <Sparkles className="h-5 w-5" />

                    Search My Photos
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

          {/* ================================================== */}
          {/* RESULTS / EVENT GALLERY */}
          {/* ================================================== */}

          <div>

            {/* RESULT HEADER */}

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h3 className="text-[24px] font-semibold text-[#111]">
                  {matches !== null
                    ? `Found ${matches.length} Matches`
                    : "All Event Photos"}
                </h3>

                <p className="text-[#737378] text-[15px] mt-1">
                  {matches !== null
                    ? "Showing AI-matched photos for this event."
                    : `${allPhotos.length} total photos available for this event`}
                </p>

              </div>

              {matches !== null && (
                <button
                  onClick={resetSearch}
                  className="text-sm underline text-[#666] hover:text-black font-medium"
                >
                  Reset Search
                </button>
              )}

            </div>

            {/* ================================================== */}
            {/* PHOTO GRID */}
            {/* ================================================== */}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white p-6 rounded-[32px] border border-[#e5e5e5] shadow-sm">

              {/* ================================================= */}
              {/* AI MATCH RESULTS */}
              {/* ================================================= */}

              {matches !== null ? (

                matches.length > 0 ? (

                  matches.map(
                    (match, idx) => (

                      <div
                        key={
                          match.id ||
                          idx
                        }
                        className="relative aspect-square rounded-[18px] overflow-hidden group shadow-sm border border-[#e5e5e5]"
                      >

                        <img
                          src={
                            match.image_url
                          }
                          alt={`Match ${
                            idx + 1
                          }`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                          {(
                            match.similarity *
                            100
                          ).toFixed(
                            1
                          )}
                          % match
                        </div>

                      </div>
                    )
                  )

                ) : (

                  <div className="col-span-full py-12 text-center text-[#737378]">

                    <p className="font-medium">
                      No matching faces
                      found in this event.
                    </p>

                    <p className="text-sm mt-2">
                      Try uploading a
                      clearer selfie.
                    </p>

                  </div>

                )

              ) : (

                /* ================================================= */
                /* NORMAL EVENT GALLERY */
                /* ================================================= */

                allPhotos.length > 0 ? (

                  allPhotos.map(
                    (photo, index) => (

                      <div
                        key={
                          photo.id ||
                          index
                        }
                        className="relative aspect-square rounded-[18px] overflow-hidden border border-[#e5e5e5] bg-[#f0f0f0]"
                      >

                        {photo.image_url ? (
                          <img
                            src={
                              photo.image_url
                            }
                            alt={`Event Photo ${
                              index + 1
                            }`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm text-[#888]">
                            Image unavailable
                          </div>
                        )}

                      </div>
                    )
                  )

                ) : (

                  <div className="col-span-full py-12 text-center text-[#737378]">
                    No photos have been
                    uploaded for this event
                    yet.
                  </div>

                )

              )}

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}