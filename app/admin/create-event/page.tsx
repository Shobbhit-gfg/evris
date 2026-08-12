"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreateEvent = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          location,
          event_date: eventDate,
        },
      ]);

    if (error) {
      console.log("SUPABASE ERROR:", JSON.stringify(error, null, 2));
      console.log("SUPABASE ERROR RAW:", error);
      setMessage(JSON.stringify(error));
      setLoading(false);
      return;
    }

    setMessage("Event created successfully!");

    setTimeout(() => {
      router.push("/admin/events");
    }, 1000);
  };

  return (
    <main className="mx-auto max-w-3xl p-10">
      <h1 className="text-4xl font-bold mb-8">
        Create Event
      </h1>

      <form
        onSubmit={handleCreateEvent}
        className="flex flex-col gap-6"
      >
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-4 rounded-xl"
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-4 rounded-xl min-h-[150px]"
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border p-4 rounded-xl"
        />

        <input
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="border p-4 rounded-xl"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-full h-14"
        >
          {loading ? "Creating..." : "Create Event"}
        </button>

        {message && (
          <p className="text-sm">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}