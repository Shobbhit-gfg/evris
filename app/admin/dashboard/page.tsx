"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

// Days that show "uploaded" (filled) state, for demo purposes — swap for real data later
const uploadedDays = new Set([1, 3, 8, 10, 15, 17, 22, 24, 29, 31]);

export default function DashboardPage() {
  const [viewDate, setViewDate] = useState(new Date(2026, 7, 1)); // Aug 2026, matching Figma

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const changeMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const recognitionAccuracy = 92; // %

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4">
          <AdminNavbar />

          {/* Welcome / Stats Card */}
          <div className="mx-auto mt-[24px] flex w-full max-w-[1301px] flex-wrap items-center justify-between gap-6 rounded-[34px] bg-[#eaeaea] p-10 shadow-[0px_4px_97.6px_8px_rgba(0,0,0,0.15)]">
            <div>
              <h1 className="heading-font text-[clamp(36px,4.5vw,56px)] font-semibold text-[#111111]">
                Hi , Username
              </h1>
              <div className="mt-6 flex flex-col gap-3">
                <p className="body-font flex items-center gap-2 text-[18px] text-[#8c8c8c]">
                  <span className="h-2 w-2 rounded-full bg-[#8c8c8c]" />
                  Total Visitors <span className="font-semibold text-[#121212]">2,000+</span>
                </p>
                <p className="body-font flex items-center gap-2 text-[18px] text-[#8c8c8c]">
                  <span className="h-2 w-2 rounded-full bg-[#8c8c8c]" />
                  AI Face Recognition <span className="font-semibold text-[#121212]">1,590+</span>
                </p>
                <p className="body-font flex items-center gap-2 text-[18px] text-[#8c8c8c]">
                  <span className="h-2 w-2 rounded-full bg-[#8c8c8c]" />
                  Reports <span className="font-semibold text-[#121212]">10+</span>
                </p>
              </div>
            </div>

            <Link
              href="/admin/create-event"
              className="body-font flex h-[64px] items-center justify-center rounded-full bg-black px-10 text-[18px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
            >
              Upload photos / Create event
            </Link>
          </div>

          {/* Calendar + AI Status */}
          <div className="mx-auto mt-8 flex w-full max-w-[1301px] flex-col gap-8 pb-20 lg:flex-row">

            {/* Calendar */}
            <div className="flex-1 rounded-[34px] bg-[#f3f3f3] p-8">
              <h2 className="heading-font text-center text-[28px] font-semibold text-[#111111]">
                Data uploaded
              </h2>
              <div className="mt-6 border-t border-[#dcdcdc] pt-6">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#a9d9dc] transition hover:bg-[#8fc9cd]"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#111111]" />
                  </button>
                  <p className="body-font w-[180px] text-center text-[22px] text-[#8c8b8b]">
                    {monthNames[month]} <span className="font-semibold text-[#111111]">{year}</span>
                  </p>
                  <button
                    onClick={() => changeMonth(1)}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#a9d9dc] transition hover:bg-[#8fc9cd]"
                  >
                    <ChevronRight className="h-5 w-5 text-[#111111]" />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-y-3 text-center">
                  {weekdays.map((d, i) => (
                    <p key={i} className="body-font text-[16px] text-[#8a8a8a]">{d}</p>
                  ))}
                  {calendarCells.map((day, i) => (
                    <div key={i} className="flex items-center justify-center py-1">
                      {day && (
                        <span
                          className={`
                            flex h-9 w-9 items-center justify-center rounded-full text-[15px]
                            ${uploadedDays.has(day)
                              ? "bg-[#a9d9dc] text-[#111111]"
                              : "bg-[#e4e4e4] text-[#8a8a8a]"}
                          `}
                        >
                          {day}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Search Engine Status */}
            <div className="w-full rounded-[34px] bg-[#f3f3f3] p-8 shadow-[0px_4px_53.5px_0px_rgba(0,0,0,0.15)] lg:w-[364px]">
              <h2 className="heading-font text-[24px] font-semibold text-[#111111]">
                Ai - Search Engine
              </h2>
              <div className="mt-4 flex items-center justify-between border-t border-[#dcdcdc] pt-4">
                <p className="body-font text-[22px] text-[#111111]/60">
                  Status : <span className="text-[#a1a1a1]">Online</span>
                </p>
                <span className="h-[15px] w-[15px] rounded-full bg-[#3ddc84]" />
              </div>

              <div className="mt-8 space-y-6">
                <p className="body-font text-[22px] text-[#111111]/60">
                  Face indexed<br /><span className="text-black">1543</span>
                </p>
                <p className="body-font text-[22px] text-[#111111]/60">
                  Today&apos;s Searches<br /><span className="text-black">100</span>
                </p>
              </div>

              <div className="mt-10 flex flex-col items-center">
                <div
                  className="relative flex h-[140px] w-[140px] items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#1a8287 0% ${recognitionAccuracy}%, #d9d9d9 ${recognitionAccuracy}% 100%)`,
                  }}
                >
                  <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#f3f3f3]">
                    <span className="body-font text-[22px] font-semibold text-[#111111]">
                      {recognitionAccuracy}%
                    </span>
                  </div>
                </div>
                <p className="body-font mt-4 text-[18px] text-[#111111]/60">
                  Recognition Accuracy
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}