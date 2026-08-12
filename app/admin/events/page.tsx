"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const summaryStats = [
  { label: "Seminars & Workshops", count: 12, color: "#30bcc3" },
  { label: "Pending Approval", count: 3, color: "#1a8287" },
  { label: "Fests & Concerts", count: 9, color: "#123c3e" },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch Error:", error);
      return;
    }

    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = confirm(
      "Delete this event? This can't be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete Error:", error);
      alert(error.message);
      return;
    }

    fetchEvents();
  };

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4">

          <div className="mx-auto mt-8 w-full max-w-[1342px] rounded-[49px] bg-[#d9d9d9] p-10">
            <h1 className="heading-font text-[clamp(36px,4.5vw,56px)] font-semibold text-[#111111]">
              Event Analysis
            </h1>

            <div className="mt-6 flex flex-col gap-4">
              {summaryStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex h-[54px] w-fit items-center rounded-full px-8"
                  style={{ backgroundColor: stat.color }}
                >
                  <span className="body-font text-[18px] font-medium text-white">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-14 flex w-full max-w-[1301px] flex-wrap items-center justify-between gap-4">
            <h2 className="heading-font text-[clamp(28px,3.5vw,40px)] font-semibold text-[#121212]">
              Manage Events
            </h2>

            <Link
              href="/admin/create-event"
              className="body-font flex h-[56px] items-center justify-center rounded-full bg-black px-7 text-[18px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
            >
              + Create Event
            </Link>
          </div>

          <div className="mx-auto mb-20 mt-6 flex w-full max-w-[1301px] flex-col gap-6 rounded-[34px] bg-[#eaeaea] p-8">

            {loading && (
              <p className="text-center text-lg">
                Loading events...
              </p>
            )}

            {!loading && events.length === 0 && (
              <p className="body-font py-10 text-center text-[18px] text-[#8c8c8c]">
                No events yet.
              </p>
            )}

            {events.map((event) => {
              const eventDate =
                event.date || event.event_date;

              const isUpcoming =
                new Date(eventDate) > new Date();

              return (
                <div
                  key={event.id}
                  className="flex flex-wrap items-center gap-6 rounded-[24px] bg-white p-5"
                >
                  <div
                    className="h-[90px] w-[90px] shrink-0 rounded-[18px] bg-[#30bcc3]"
                  />

                  <div className="flex flex-1 flex-col gap-1">
                    <p className="body-font text-[22px] font-semibold text-[#121212]">
                      {event.title}
                    </p>

                    <p className="body-font text-[16px] text-[#737378]">
                      {eventDate
                        ? new Date(eventDate).toLocaleDateString()
                        : "No Date"}
                    </p>

                    {event.location && (
                      <p className="body-font text-[14px] text-[#999]">
                        {event.location}
                      </p>
                    )}
                  </div>

                  <span
                    className={`body-font rounded-full px-4 py-2 text-[14px] font-medium ${
                      isUpcoming
                        ? "bg-[#30bcc3] text-white"
                        : "bg-[#d9d9d9] text-[#4d4d4d]"
                    }`}
                  >
                    {isUpcoming ? "Upcoming" : "Completed"}
                  </span>

                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="body-font rounded-full border-[1.5px] border-black px-5 py-2 text-[14px] font-medium text-[#121212] transition hover:bg-black hover:text-white"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(event.id)}
                    className="body-font rounded-full bg-black px-5 py-2 text-[14px] font-medium text-white transition hover:bg-[#333]"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}