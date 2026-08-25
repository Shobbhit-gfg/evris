"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";
import { getFaceEmbeddingFromServer } from "@/lib/api/extractFace";

const placeholderColors = [
  "#30bcc3",
  "#1a8287",
  "rgba(18,60,62,0.5)",
  "rgba(48,188,195,0.5)",
  "rgba(26,130,135,0.5)",
  "rgba(18,60,62,0.5)",
];

function FloatingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-[54px] w-full border-b border-[#e5e5e5] bg-[#f6f6f6]">
      <label className="body-font pointer-events-none absolute left-2 top-[8px] text-[14px] font-medium text-[#66666b]">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CreateEventPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // ADD PHOTOS
  // --------------------------------------------------

  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;

    setPhotos((prev) => {
      const newPhotos = [...prev, ...Array.from(files)];
      return newPhotos.slice(0, 20);
    });
  };

  // --------------------------------------------------
  // DRAG & DROP
  // --------------------------------------------------

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleAddPhotos(e.dataTransfer.files);
  };

  // --------------------------------------------------
  // REMOVE PHOTO
  // --------------------------------------------------

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) =>
      prev.filter((_, photoIndex) => photoIndex !== index)
    );

    setCoverIndex((prev) => {
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  // --------------------------------------------------
  // CREATE EVENT
  // --------------------------------------------------

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("=================================");
    console.log("🚀 CREATE EVENT STARTED");
    console.log("=================================");

    console.log({
      title,
      category,
      eventDate,
      location,
      description,
      photosCount: photos.length,
      coverIndex,
    });

    setLoading(true);
    setMessage("");

    try {
      // ==================================================
      // 1. UPLOAD COVER IMAGE
      // ==================================================

      let coverImageUrl = "";

      if (photos.length > 0) {
        const coverPhoto = photos[coverIndex];
        const coverFileName = `cover-${Date.now()}-${coverPhoto.name}`;

        console.log("📸 Uploading cover:", coverFileName);

        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(coverFileName, coverPhoto);

        if (uploadError) {
          console.error("❌ Cover upload error:", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("event-images")
          .getPublicUrl(coverFileName);

        coverImageUrl = publicUrl;

        console.log("✅ Cover uploaded");
        console.log("Cover URL:", coverImageUrl);
      }

      // ==================================================
      // 2. CREATE EVENT
      // ==================================================

      console.log("📝 Creating event...");

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert([
          {
            title,
            category,
            description,
            location,
            event_date: eventDate,
            cover_image_url: coverImageUrl,
          },
        ])
        .select()
        .single();

      console.log("Inserted Event:", eventData);
      console.log("Insert Error:", eventError);

      if (eventError) {
        throw eventError;
      }

      if (!eventData) {
        throw new Error("Event was created but no event data was returned.");
      }

      const eventId = eventData.id;

      console.log("=================================");
      console.log("✅ EVENT CREATED");
      console.log("Event ID:", eventId);
      console.log("=================================");

      // ==================================================
      // 3. PROCESS EVERY PHOTO
      // ==================================================

      if (photos.length > 0) {
        console.log(`📷 Processing ${photos.length} photos...`);

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];

          console.log("---------------------------------");
          console.log(`📷 Processing photo ${i + 1}/${photos.length}`);
          console.log("Filename:", photo.name);

          // ------------------------------------------------
          // 3A. UPLOAD PHOTO TO STORAGE
          // ------------------------------------------------

          const fileName = `${eventId}/${Date.now()}-${i}-${photo.name}`;

          console.log("Uploading:", fileName);

          const { error: photoUploadError } = await supabase.storage
            .from("event-images")
            .upload(fileName, photo);

          if (photoUploadError) {
            console.error("❌ Photo Storage Upload Error:", photoUploadError);
            continue;
          }

          console.log("✅ Photo uploaded to Storage");

          // ------------------------------------------------
          // 3B. GET PUBLIC URL
          // ------------------------------------------------

          const {
            data: { publicUrl },
          } = supabase.storage
            .from("event-images")
            .getPublicUrl(fileName);

          console.log("Photo URL:", publicUrl);

          // ------------------------------------------------
          // 3C. INSERT INTO PHOTOS TABLE
          // ------------------------------------------------

          const { data: photoData, error: photoDbError } = await supabase
            .from("photos")
            .insert({
              event_id: eventId,
              image_url: publicUrl,
            })
            .select()
            .single();

          if (photoDbError) {
            console.error("❌ Photo Database Insert Error:", photoDbError);
          } else {
            console.log("✅ Photo record inserted:", photoData);

            // ==================================================
            // 3D. EXTRACT FACE EMBEDDING USING PYTHON
            // ==================================================

            console.log("🐍 Sending image to Python Face API...");

            try {
              const embedding = await getFaceEmbeddingFromServer(photo);

              if (embedding) {
                console.log(`✅ Face embedding received for ${photo.name}`);
                console.log("Embedding dimensions:", embedding.length);

                // ----------------------------------------------
                // SAVE VECTOR TO SUPABASE
                // ----------------------------------------------

                const { data: embeddingData, error: embeddingError } = await supabase
                  .from("face_embeddings")
                  .insert({
                    event_id: eventId,
                    image_url: publicUrl,
                    embedding: embedding,
                  })
                  .select()
                  .single();

                if (embeddingError) {
                  console.error("❌ Face Embedding Database Error:", embeddingError);
                  console.error("Embedding error details:", JSON.stringify(embeddingError, null, 2));
                } else {
                  console.log("=================================");
                  console.log("🎉 FACE VECTOR SAVED SUCCESSFULLY");
                  console.log("Photo:", photo.name);
                  console.log("Vector dimensions:", embedding.length);
                  console.log("Embedding ID:", embeddingData?.id);
                  console.log("Event ID:", eventId);
                  console.log("=================================");
                }
              } else {
                console.log(`⚠️ No face embedding returned for ${photo.name}`);
              }
            } catch (faceErr) {
              console.error(`❌ Python Face Extraction Error for ${photo.name}:`, faceErr);
            }
          }
        }
      }

      // ==================================================
      // 4. SUCCESS
      // ==================================================

      console.log("=================================");
      console.log("🎉 EVENT CREATION COMPLETE");
      console.log("=================================");

      setMessage("Event created successfully! Photos and face data are being processed.");

      setTimeout(() => {
        router.push("/admin/events");
      }, 1500);
    } catch (err: any) {
      console.error("=================================");
      console.error("❌ FULL CREATE EVENT ERROR");
      console.error("=================================");
      console.error(err);

      setMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4 pb-20">
          <AdminNavbar />

          <div className="mx-auto mt-8 w-full max-w-[1174px]">
            {/* HEADER */}
            <h1 className="heading-font text-[clamp(32px,4vw,40px)] font-semibold text-[#121212]">
              Create / Upload Event
            </h1>

            <p className="body-font mt-2 text-[18px] text-[#737378]">
              Fill in the event details and upload photos to publish a new event.
            </p>

            {/* FORM */}
            <form
              onSubmit={handleCreateEvent}
              className="mt-10 flex flex-col gap-8 lg:flex-row"
            >
              {/* ==========================================
                  EVENT DETAILS
              ========================================== */}

              <div className="w-full max-w-[680px] rounded-[44px] bg-[rgba(237,237,237,0.6)] p-10">
                <h2 className="body-font text-[26px] font-semibold text-[#121212]">
                  Event Details
                </h2>

                <div className="mt-6 flex flex-col gap-4">
                  {/* TITLE */}
                  <FloatingField label="Event Title">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. AI & Robotics Summit 2026"
                      required
                      className="body-font absolute left-2 top-[26px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none placeholder:text-[#a6a6a6]"
                    />
                  </FloatingField>

                  {/* CATEGORY */}
                  <FloatingField label="Category">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="body-font absolute left-2 top-[24px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none"
                    >
                      <option value="" disabled>
                        Seminar / Workshop / Fest / Cultural
                      </option>
                      <option value="Seminar">Seminar</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Fest">Fest</option>
                      <option value="Cultural">Cultural</option>
                    </select>
                  </FloatingField>

                  {/* DATE */}
                  <FloatingField label="Date">
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="body-font absolute left-2 top-[24px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none"
                    />
                  </FloatingField>

                  {/* LOCATION */}
                  <FloatingField label="Location">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Main Auditorium, RKGIT"
                      className="body-font absolute left-2 top-[26px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none placeholder:text-[#a6a6a6]"
                    />
                  </FloatingField>

                  {/* DESCRIPTION */}
                  <div className="relative h-[160px] w-full rounded-[20px] bg-[#f6f6f6]">
                    <label className="body-font pointer-events-none absolute left-2 top-[8px] text-[14px] font-medium text-[#66666b]">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the event..."
                      className="body-font absolute left-2 top-[30px] h-[120px] w-[calc(100%-16px)] resize-none bg-transparent text-[16px] text-[#121212] outline-none placeholder:text-[#a6a6a6]"
                    />
                  </div>
                </div>
              </div>

              {/* ==========================================
                  UPLOAD PHOTOS
              ========================================== */}

              <div className="w-full rounded-[44px] bg-[rgba(237,237,237,0.6)] p-10 lg:w-[460px]">
                <h2 className="body-font text-[26px] font-semibold text-[#121212]">
                  Upload Photos
                </h2>

                {/* DROP AREA */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 flex h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border-[1.5px] border-dashed border-[#b3b3b3] bg-white"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddPhotos(e.target.files)}
                  />
                  <div className="h-[52px] w-[52px] rounded-full bg-[#30bcc3]" />
                  <p className="body-font text-center text-[16px] text-[#737378]">
                    Drag & drop photos, or click to browse
                  </p>
                  <p className="body-font text-center text-[13px] text-[#999]">
                    JPG or PNG, up to 20 photos ({photos.length}/20)
                  </p>
                </div>

                {/* PHOTO GRID */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {photos.length === 0
                    ? placeholderColors.map((color, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-[14px]"
                          style={{
                            backgroundColor: color,
                          }}
                        />
                      ))
                    : photos.map((file, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setCoverIndex(i)}
                          className="group relative aspect-square overflow-hidden rounded-[14px] bg-[#d9d9d9]"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {coverIndex === i && (
                            <span className="body-font absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#30bcc3] px-[10px] py-[5px] text-[10px] font-semibold text-white">
                              ★ Cover
                            </span>
                          )}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(i);
                            }}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                          >
                            ×
                          </span>
                        </button>
                      ))}
                </div>

                {/* COVER INFO */}
                <p className="body-font mt-4 text-[22px] font-medium text-[#121212]">
                  Cover Page
                </p>
                <p className="body-font mt-1 text-[18px] text-[#8c8c8c]">
                  Tap a photo above to set it as the event cover.
                </p>

                {/* ADD MORE */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="body-font mt-6 flex h-[53px] items-center justify-center rounded-full bg-black px-7 text-[17px] font-medium text-white transition hover:bg-[#333]"
                >
                  Add More Photos
                </button>
              </div>
            </form>

            {/* MESSAGE */}
            {message && (
              <p className="body-font mt-6 text-[15px] text-[#737378]">
                {message}
              </p>
            )}

            {/* ==========================================
                ACTION BUTTONS
            ========================================== */}

            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/admin/events"
                className="body-font flex h-[58px] items-center justify-center rounded-full border-[1.5px] border-black px-9 text-[18px] font-medium text-[#121212] transition hover:bg-black hover:text-white"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector(
                    "form"
                  ) as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
                disabled={loading}
                className="body-font flex h-[58px] items-center justify-center rounded-full bg-black px-9 text-[18px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Publishing..." : "Publish Event"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}