"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";
import { getFaceEmbeddingsFromServer } from "@/lib/api/extractFace";

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

    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    setPhotos((prev) => {
      const newPhotos = [...prev, ...validFiles];
      return newPhotos.slice(0, 20); // Keep max 20 logic
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
    setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index));

    setCoverIndex((prev) => {
      if (photos.length <= 1) return 0;
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  // --------------------------------------------------
  // CREATE EVENT (NOW WITH BATCHING)
  // --------------------------------------------------
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    console.log("=================================");
    console.log("🚀 CREATE EVENT STARTED");
    console.log("=================================");

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

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-images").getPublicUrl(coverFileName);

        coverImageUrl = publicUrl;
        console.log("✅ Cover uploaded:", coverImageUrl);
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

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Event was created but no event data was returned.");

      const eventId = eventData.id;
      console.log("✅ EVENT CREATED | Event ID:", eventId);

      // ==================================================
      // 3. PROCESS PHOTOS IN PARALLEL (BATCHES OF 3)
      // ==================================================
      if (photos.length > 0) {
        console.log(`📷 Processing ${photos.length} photos in batches...`);

        const BATCH_SIZE = 3;

        for (let i = 0; i < photos.length; i += BATCH_SIZE) {
          const batch = photos.slice(i, i + BATCH_SIZE);
          
          console.log(`⚡ Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

          // Process all photos in this batch at the exact same time
          await Promise.all(
            batch.map(async (photo, batchIdx) => {
              const actualIndex = i + batchIdx;
              const fileName = `${eventId}/${Date.now()}-${actualIndex}-${photo.name}`;

              // 3A. Upload to Storage
              const { error: photoUploadError } = await supabase.storage
                .from("event-images")
                .upload(fileName, photo);

              if (photoUploadError) {
                console.error(`❌ Photo Upload Error (${photo.name}):`, photoUploadError);
                return;
              }

              // 3B. Get Public URL
              const {
                data: { publicUrl },
              } = supabase.storage.from("event-images").getPublicUrl(fileName);

              // 3C. Insert into Photos Table
              const { data: photoData, error: photoDbError } = await supabase
                .from("photos")
                .insert({
                  event_id: eventId,
                  image_url: publicUrl,
                })
                .select()
                .single();

              if (photoDbError) {
                console.error(`❌ Photo DB Error (${photo.name}):`, photoDbError);
                return;
              }

              // 3D. Extract and Save Face Embeddings
              try {
                const embeddings = await getFaceEmbeddingsFromServer(photo);

                if (embeddings.length === 0) {
                  console.log(`⚠️ No faces detected in ${photo.name}`);
                  return;
                }

                // Insert all faces for this photo at once
                const embeddingRows = embeddings
                  .filter((emb) => emb.length === 512)
                  .map((emb) => ({
                    event_id: eventId,
                    image_url: publicUrl,
                    embedding: emb,
                  }));

                if (embeddingRows.length > 0) {
                  const { error: insertError } = await supabase
                    .from("face_embeddings")
                    .insert(embeddingRows);

                  if (insertError) {
                    console.error(`❌ DB Insert Error for faces in ${photo.name}:`, insertError);
                  } else {
                    console.log(`🎉 Saved ${embeddingRows.length} vectors for ${photo.name}`);
                  }
                }
              } catch (faceErr) {
                console.error(`❌ Face Extraction Error for ${photo.name}:`, faceErr);
              }
            })
          );
        }
      }

      // ==================================================
      // 4. SUCCESS
      // ==================================================
      console.log("=================================");
      console.log("🎉 EVENT CREATION COMPLETE");
      console.log("=================================");

      setMessage("Event created successfully! Photos and face data have been processed.");

      setTimeout(() => {
        router.push("/admin/events");
      }, 1500);

    } catch (err: any) {
      console.error("❌ FULL CREATE EVENT ERROR:", err);
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
            <h1 className="heading-font text-[clamp(32px,4vw,40px)] font-semibold text-[#121212]">
              Create / Upload Event
            </h1>
            <p className="body-font mt-2 text-[18px] text-[#737378]">
              Fill in the event details and upload photos to publish a new event.
            </p>

            <form onSubmit={handleCreateEvent} className="mt-10 flex flex-col gap-8 lg:flex-row">
              {/* EVENT DETAILS */}
              <div className="w-full max-w-[680px] rounded-[44px] bg-[rgba(237,237,237,0.6)] p-10">
                <h2 className="body-font text-[26px] font-semibold text-[#121212]">
                  Event Details
                </h2>

                <div className="mt-6 flex flex-col gap-4">
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

                  <FloatingField label="Category">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="body-font absolute left-2 top-[24px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none"
                    >
                      <option value="" disabled>Seminar / Workshop / Fest / Cultural</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Fest">Fest</option>
                      <option value="Cultural">Cultural</option>
                    </select>
                  </FloatingField>

                  <FloatingField label="Date">
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="body-font absolute left-2 top-[24px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none"
                    />
                  </FloatingField>

                  <FloatingField label="Location">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Main Auditorium, RKGIT"
                      className="body-font absolute left-2 top-[26px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none placeholder:text-[#a6a6a6]"
                    />
                  </FloatingField>

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

              {/* UPLOAD PHOTOS */}
              <div className="w-full rounded-[44px] bg-[rgba(237,237,237,0.6)] p-10 lg:w-[460px]">
                <h2 className="body-font text-[26px] font-semibold text-[#121212]">
                  Upload Photos
                </h2>

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
                    onChange={(e) => {
                      handleAddPhotos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <div className="h-[52px] w-[52px] rounded-full bg-[#30bcc3]" />
                  <p className="body-font text-center text-[16px] text-[#737378]">
                    Drag & drop photos, or click to browse
                  </p>
                  <p className="body-font text-center text-[13px] text-[#999]">
                    JPG or PNG, up to 20 photos ({photos.length}/20)
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {photos.length === 0
                    ? placeholderColors.map((color, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-[14px]"
                          style={{ backgroundColor: color }}
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

                <p className="body-font mt-4 text-[22px] font-medium text-[#121212]">
                  Cover Page
                </p>
                <p className="body-font mt-1 text-[18px] text-[#8c8c8c]">
                  Tap a photo above to set it as the event cover.
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="body-font mt-6 flex h-[53px] items-center justify-center rounded-full bg-black px-7 text-[17px] font-medium text-white transition hover:bg-[#333]"
                >
                  Add More Photos
                </button>
              </div>
            </form>

            {message && (
              <p className="body-font mt-6 text-[15px] text-[#737378]">{message}</p>
            )}

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
                  const form = document.querySelector("form") as HTMLFormElement | null;
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