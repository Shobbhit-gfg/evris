"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { Search, Calendar, ChevronRight, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const categoryColors: Record<string, string> = {
  Seminar: "#30bcc3",
  Workshop: "#1a8287",
  Cultural: "#1a8287",
  Fest: "#123c3e",
};

const filters = ["All", "Seminar", "Workshop", "Fest", "Cultural"];

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      console.error("Fetch Error:", error);
      setLoading(false);
      return;
    }

    setEvents(data || []);
    console.log("Events fetched:", data);
    console.table(data);
    setLoading(false);
  };

  const filtered = events.filter((e) => {
    const matchesFilter =
      activeFilter === "All" ||
      (e.category && e.category === activeFilter);

    const matchesQuery =
      e.title?.toLowerCase().includes(query.toLowerCase());

    const matchesDate =
      !dateFilter ||
      (e.event_date &&
        new Date(e.event_date).toISOString().split("T")[0] === dateFilter);

    return matchesFilter && matchesQuery && matchesDate;
  });

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <section className="px-[59px] pt-16 pb-24">
          <h1 className="heading-font text-[clamp(40px,6vw,72px)] font-semibold text-[#111111]">
            All Events
          </h1>
          <p className="body-font mt-4 text-[clamp(16px,1.6vw,20px)] text-[#737378]">
            Every seminar, workshop, fest and concert we&apos;ve captured — all in one place.
          </p>

          {/* Search + Date Filter */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex h-[64px] w-full max-w-[560px] items-center gap-3 rounded-full border border-[#d9d9d9] bg-[#f6f6f6] px-6">
              <Search className="h-5 w-5 text-[#8c8c8c]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events by name..."
                className="body-font flex-1 bg-transparent text-[18px] text-[#4d4d4d] placeholder:text-[#8c8c8c] outline-none"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDatePicker((v) => !v)}
                className={`
                  flex h-[58px] items-center gap-2 rounded-full border px-6 text-[18px] font-medium transition
                  ${
                    dateFilter
                      ? "border-black bg-black text-white"
                      : "border-[#d9d9d9] bg-[#f6f6f6] text-[#4d4d4d] hover:bg-[#eeeeee]"
                  }
                `}
              >
                <Calendar className="h-5 w-5" />
                {dateFilter
                  ? new Date(dateFilter).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Filter by date"}
                {dateFilter && (
                  <X
                    className="h-4 w-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFilter("");
                      setShowDatePicker(false);
                    }}
                  />
                )}
              </button>

              {showDatePicker && (
                <input
                  type="date"
                  autoFocus
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setShowDatePicker(false);
                  }}
                  onBlur={() => setShowDatePicker(false)}
                  className="absolute left-0 top-[68px] z-10 rounded-xl border border-[#d9d9d9] bg-white px-4 py-3 text-[16px] text-[#4d4d4d] shadow-lg outline-none"
                />
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`
                  rounded-full px-[26px] py-[14px] text-[17px] font-medium transition-all duration-200
                  ${
                    activeFilter === f
                      ? "bg-black text-white"
                      : "border border-[#d9d9d9] bg-[#f6f6f6] text-[#404040] hover:bg-[#eeeeee]"
                  }
                `}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Loading UI */}
          {loading && (
            <p className="mt-10 text-center text-lg text-[#737378]">
              Loading events...
            </p>
          )}

          {/* Event Cards Grid */}
          {!loading && (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block overflow-hidden rounded-[28px] bg-white shadow-[0px_6px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_12px_32px_rgba(0,0,0,0.14)]"
                >
                  <div className="relative h-[190px] w-full">
                    <Image
                      src={
                        event.cover_image_url?.trim() ||
                        event.cover_image?.trim() ||
                        "/gallery/gallery1.webp"
                      }
                      alt={event.title || "Event"}
                      fill
                      className="object-cover"
                    />

                    <span
                      className="absolute left-4 top-4 rounded-full px-[14px] py-[6px] text-[13px] font-medium text-white"
                      style={{
                        backgroundColor:
                          categoryColors[event.category] || "#1a8287",
                      }}
                    >
                      {event.category || "Event"}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="body-font text-[19px] font-semibold text-[#121212]">
                      {event.title}
                    </p>

                    <p className="body-font mt-2 text-[14px] text-[#8c8c8c]">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : "No Date"}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#eaeaea] pt-4">
                      <span className="body-font text-[15px] font-medium text-[#4d4d4d]">
                        Event Gallery
                      </span>

                      <ChevronRight className="h-[18px] w-[18px] text-[#4d4d4d]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <p className="body-font mt-14 text-center text-[18px] text-[#8c8c8c]">
              No events match your search{dateFilter ? " for this date" : ""}.
            </p>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}