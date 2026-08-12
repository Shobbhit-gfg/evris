"use client";

import { useState } from "react";
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

const events = [
  {
    title: "AECE Personal Interview",
    date: "Aug 3, 2026",
    photos: "18 photos",
    category: "Seminar",
    image: "/eventsection/seminar&workshop/1.jpg",
  },
  {
    title: "CS/IT Orientation",
    date: "Aug 3, 2026",
    photos: "24 photos",
    category: "Seminar",
    image: "/eventsection/seminar&workshop/2.jpg",
  },
  {
    title: "Resume Building Workshop",
    date: "Jul 28, 2026",
    photos: "15 photos",
    category: "Workshop",
    image: "/eventsection/seminar&workshop/3.jpg",
  },
  {
    title: "Nasha Mukt Yuva Awareness",
    date: "Jul 30, 2026",
    photos: "20 photos",
    category: "Seminar",
    image: "/eventsection/seminar&workshop/4.jpg",
  },
  {
    title: "#AryabhattKaZero Night",
    date: "Aug 5, 2026",
    photos: "32 photos",
    category: "Cultural",
    image: "/eventsection/fest&event/1.jpg",
  },
  {
    title: "Farewell 2026",
    date: "Jun 12, 2026",
    photos: "45 photos",
    category: "Cultural",
    image: "/eventsection/fest&event/2.jpg",
  },
  {
    title: "Final Whistle — Seniors Match",
    date: "May 20, 2026",
    photos: "28 photos",
    category: "Cultural",
    image: "/eventsection/fest&event/3.jpg",
  },
  {
    title: "TATVA 2K26",
    date: "Apr 3, 2026",
    photos: "60 photos",
    category: "Fest",
    image: "/eventsection/fest&event/4.jpg",
  },
];

const filters = ["All", "Seminar", "Workshop", "Fest", "Cultural"];

// Converts "Aug 3, 2026" -> "2026-08-03" so it can be compared to an <input type="date"> value
function toISODate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filtered = events.filter((e) => {
    const matchesFilter = activeFilter === "All" || e.category === activeFilter;
    const matchesQuery = e.title.toLowerCase().includes(query.toLowerCase());
    const matchesDate = !dateFilter || toISODate(e.date) === dateFilter;
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
                  ${dateFilter
                    ? "border-black bg-black text-white"
                    : "border-[#d9d9d9] bg-[#f6f6f6] text-[#4d4d4d] hover:bg-[#eeeeee]"}
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
                  ${activeFilter === f
                    ? "bg-black text-white"
                    : "border border-[#d9d9d9] bg-[#f6f6f6] text-[#404040] hover:bg-[#eeeeee]"}
                `}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Event Cards Grid */}
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((event) => (
              <Link
                key={event.title}
                href="#"
                className="block overflow-hidden rounded-[28px] bg-white shadow-[0px_6px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_12px_32px_rgba(0,0,0,0.14)]"
              >
                <div className="relative h-[190px] w-full">
                  <Image src={event.image} alt={event.title} fill className="object-cover" />
                  <span
                    className="absolute left-4 top-4 rounded-full px-[14px] py-[6px] text-[13px] font-medium text-white"
                    style={{ backgroundColor: categoryColors[event.category] }}
                  >
                    {event.category}
                  </span>
                </div>
                <div className="p-5">
                  <p className="body-font text-[19px] font-semibold text-[#121212]">
                    {event.title}
                  </p>
                  <p className="body-font mt-2 text-[14px] text-[#8c8c8c]">{event.date}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#eaeaea] pt-4">
                    <span className="body-font text-[15px] font-medium text-[#4d4d4d]">
                      {event.photos}
                    </span>
                    <ChevronRight className="h-[18px] w-[18px] text-[#4d4d4d]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
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