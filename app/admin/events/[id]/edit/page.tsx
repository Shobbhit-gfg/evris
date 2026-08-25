"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";
import { getFaceEmbeddingFromServer } from "@/lib/api/extractFace"; // 🐍 Python Microservice Import

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

type StoragePhoto = {
  name: string;
  url: string;
};

// UUID validation regex (8-4-4-4-12 hex format)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Safe unwrapping for Next.js async params
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [existingCoverUrl, setExistingCoverUrl] = useState("");

  const [existingPhotos, setExistingPhotos] = useState<StoragePhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);

  const [loadingEvent, setLoadingEvent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEventData = async () => {
    if (!id) return;

    // Guard against invalid non-UUID parameters (prevents Supabase HTTP 400)
    if (!UUID_REGEX.test(id)) {
      console.warn("Invalid UUID passed to route:", id);
      setMessage("Invalid event ID format.");
      setLoadingEvent(false);
      return;
    }

    try {
      // Use .maybeSingle() to prevent single() errors on empty results
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Fetch event error:", error);
        setMessage("Error fetching event data.");
        setLoadingEvent(false);
        return;
      }

      if (!data) {
        setMessage("Event not found in database.");
        setLoadingEvent(false);
        return;
      }

      setTitle(data.title || "");
      setCategory(data.category || "");
      setLocation(data.location || "");
      setDescription(data.description || "");
      setExistingCoverUrl(
        data.cover_image_url?.trim() || data.cover_image?.trim() || ""
      );

      if (data.event_date) {
        const d = new Date(data.event_date);
        const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setEventDate(localISO);
      }

      const { data: files } = await supabase.storage
        .from("event-images")
        .list(id, { limit: 100 });

      if (files && files.length > 0) {
        const loadedPhotos = files
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => {
            const { data: urlData } = supabase.storage
              .from("event-images")
              .getPublicUrl(`${id}/${f.name}`);
            return {
              name: f.name,
              url: urlData.publicUrl,
            };
          });
        setExistingPhotos(loadedPhotos);
      }
    } catch (err) {
      console.error("Error loading event detail:", err);
      setMessage("Failed to load event.");
    } finally {
      setLoadingEvent(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    setNewPhotos((prev) => [...prev, ...Array.from(files)].slice(0, 20));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleAddPhotos(e.dataTransfer.files);
  };

  const handleDeleteExistingPhoto = async (fileName: string) => {
    const { error } = await supabase.storage
      .from("event-images")
      .remove([`${id}/${fileName}`]);

    if (error) {
      console.error("Delete photo error:", error);
      alert("Failed to delete photo from storage.");
      return;
    }

    setExistingPhotos((prev) => prev.filter((p) => p.name !== fileName));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!UUID_REGEX.test(id)) {
      setMessage("Cannot save: Invalid event ID.");
      setSaving(false);
      return;
    }

    let updatedCoverUrl = existingCoverUrl;

    try {
      if (newPhotos.length > 0) {
        for (const file of newPhotos) {
          const fileExt = file.name.split(".").pop();
          const cleanFileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
          const filePath = `${id}/${cleanFileName}`;

          const { error: uploadError } = await supabase.storage
            .from("event-images")
            .upload(filePath, file, { upsert: true });

          if (uploadError) {
            console.error("Upload Error:", uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("event-images")
            .getPublicUrl(filePath);
          
          const uploadedUrl = publicUrlData.publicUrl;

          if (!updatedCoverUrl) {
            updatedCoverUrl = uploadedUrl;
          }

          // --- 🐍 START PYTHON AI VECTOR EXTRACTION ---
          try {
            const embedding = await getFaceEmbeddingFromServer(file);

            if (embedding) {
              await supabase.from("face_embeddings").insert({
                event_id: id,
                image_url: uploadedUrl,
                embedding: embedding, // 512-dim ArcFace vector
              });
              console.log(`✅ Face indexed via Python for ${file.name}`);
            }
          } catch (faceErr) {
            console.error("Python Face Extraction Error:", faceErr);
          }
          // --- END PYTHON AI VECTOR EXTRACTION ---
        }
      }

      const { error: updateError } = await supabase
        .from("events")
        .update({
          title,
          category,
          description,
          location,
          event_date: eventDate,
          cover_image_url: updatedCoverUrl,
        })
        .eq("id", id);

      if (updateError) {
        console.error("SUPABASE UPDATE ERROR:", updateError);
        setMessage(updateError.message);
        setSaving(false);
        return;
      }

      setMessage("Event updated successfully!");
      setTimeout(() => {
        router.push("/admin/events");
      }, 1000);
    } catch (err) {
      console.error("Save error:", err);
      setMessage("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingEvent) {
    return (
      <>
        <Navbar />
        <main className="pt-20">
          <div className="px-4">
            <AdminNavbar />
            <p className="body-font mx-auto mt-20 w-full max-w-[1174px] text-center text-[18px] text-[#737378]">
              Loading event...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4 pb-20">
          <AdminNavbar />

          <div className="mx-auto mt-8 w-full max-w-[1174px]">
            <h1 className="heading-font text-[clamp(32px,4vw,40px)] font-semibold text-[#121212]">
              Edit Event
            </h1>
            <p className="body-font mt-2 text-[18px] text-[#737378]">
              Update the event details below and save your changes.
            </p>

            <form onSubmit={handleSave} className="mt-10 flex flex-col gap-8">
              <div className="flex flex-col gap-8 lg:flex-row">
                {/* Event Details Card */}
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
                        required
                        className="body-font absolute left-2 top-[26px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none"
                      />
                    </FloatingField>

                    <FloatingField label="Category">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="body-font absolute left-2 top-[24px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none"
                      >
                        <option value="" disabled>
                          Select category
                        </option>
                        <option value="Seminar">Seminar</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Fest">Fest</option>
                        <option value="Concert">Concert</option>
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
                        className="body-font absolute left-2 top-[26px] w-[calc(100%-16px)] bg-transparent text-[16px] text-[#121212] outline-none"
                      />
                    </FloatingField>

                    <div className="relative h-[160px] w-full rounded-[20px] bg-[#f6f6f6]">
                      <label className="body-font pointer-events-none absolute left-2 top-[8px] text-[14px] font-medium text-[#66666b]">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="body-font absolute left-2 top-[30px] h-[120px] w-[calc(100%-16px)] resize-none bg-transparent text-[16px] text-[#121212] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Photos Card */}
                <div className="w-full rounded-[44px] bg-[rgba(237,237,237,0.6)] p-10 lg:w-[460px]">
                  <h2 className="body-font text-[26px] font-semibold text-[#121212]">
                    Photos
                  </h2>

                  {/* Existing Storage Gallery */}
                  {existingPhotos.length > 0 && (
                    <div className="mt-6">
                      <p className="body-font mb-2 text-[14px] text-[#66666b]">
                        Existing Event Photos ({existingPhotos.length})
                      </p>
                      <div className="grid max-h-[220px] grid-cols-3 gap-3 overflow-y-auto pr-1">
                        {existingPhotos.map((photo) => (
                          <div
                            key={photo.name}
                            className="relative aspect-square overflow-hidden rounded-[14px] bg-[#d9d9d9]"
                          >
                            <img
                              src={photo.url}
                              alt="Event photo"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteExistingPhoto(photo.name)
                              }
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] text-white hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 flex h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[28px] border-[1.5px] border-dashed border-[#b3b3b3] bg-white text-center"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAddPhotos(e.target.files)}
                    />
                    <div className="h-[44px] w-[44px] rounded-full bg-[#30bcc3]" />
                    <p className="body-font text-[15px] text-[#737378]">
                      Drag & drop new photos, or click to browse
                    </p>
                    <p className="body-font text-[12px] text-[#999]">
                      JPG or PNG ({newPhotos.length}/20 selected)
                    </p>
                  </div>

                  {/* New Photo Queue */}
                  {newPhotos.length > 0 && (
                    <div className="mt-6">
                      <p className="body-font mb-2 text-[14px] text-[#66666b]">
                        New Uploads Queue
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {newPhotos.map((file, i) => (
                          <div
                            key={i}
                            className="relative aspect-square overflow-hidden rounded-[14px] bg-[#d9d9d9]"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New upload ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setNewPhotos((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                )
                              }
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {message && (
                <p className="body-font text-[15px] font-medium text-[#121212]">
                  {message}
                </p>
              )}

              {/* Form Actions */}
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/events"
                  className="body-font flex h-[58px] items-center justify-center rounded-full border-[1.5px] border-black px-9 text-[18px] font-medium text-[#121212] transition hover:bg-black hover:text-white"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="body-font flex h-[58px] items-center justify-center rounded-full bg-black px-9 text-[18px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}