"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const reportEntries = [
  { category: "User experience", text: "Supporting findings with visual proof such as annotated" },
  { category: "User experience", text: "Identifying navigation bottlenecks, unclear UI elements" },
  { category: "Find me", text: "Identifying navigation bottlenecks, unclear UI elements" },
  { category: "User experience", text: "Combining direct feedback (interviews, quotes )" },
  { category: "User experience", text: "Accessibility issues discovered during testing." },
  { category: "Find me", text: "Breakdown of the training, validation, and testing datasets" },
  { category: "User experience", text: "Identifying navigation bottlenecks, unclear UI elements" },
  { category: "Others", text: "Identifying navigation bottlenecks, unclear UI elements" },
  { category: "User experience", text: "Providing clear, prioritized next steps for designers" },
];

const analysisBreakdown = [
  { label: "User experience", count: 10, color: "#30bcc3" },
  { label: "Find me", count: 3, color: "#123c3e" },
  { label: "Others", count: 1, color: "#1a8287" },
];

const summaryPoints = [
  {
    title: "Category Overview & Totals",
    text: "Quantified count of total reports submitted across active categories.",
  },
  {
    title: "High-Priority Feedback Insights",
    text: "Key trends observed within the top issue segment (User Experience).",
  },
  {
    title: "Secondary Feature Performance",
    text: `Analysis of specialized tools, including facial search and profile matching ("Find Me").`,
  },
  {
    title: "Action Items & Resolution Plan",
    text: "Targeted fixes and UI updates scheduled for immediate deployment.",
  },
];

export default function AdminReportsPage() {
  const [monthIndex, setMonthIndex] = useState(7); // August
  const [year, setYear] = useState(2026);
  const [isOpen, setIsOpen] = useState(false);

  const maxCount = Math.max(...analysisBreakdown.map((b) => b.count));

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4 pb-20">
          <AdminNavbar />

          {/* Month selector */}
          <div className="relative mx-auto mt-8 w-full max-w-[1174px]">
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="flex h-[89px] w-full items-center justify-between rounded-[15px] bg-[rgba(237,237,237,0.4)] px-8 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.15)]"
            >
              <p className="body-font text-[28px] text-[#4b4b56]">
                {months[monthIndex]} <span className="font-semibold text-black">{year}</span>
              </p>
              <ChevronDown
                className={`h-6 w-6 text-[#4b4b56] transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-[15px] bg-white p-4 shadow-lg">
                <div className="grid grid-cols-3 gap-2">
                  {months.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMonthIndex(i);
                        setIsOpen(false);
                      }}
                      className={`body-font rounded-lg px-3 py-2 text-[16px] transition ${
                        i === monthIndex ? "bg-black text-white" : "text-[#4b4b56] hover:bg-[#f0f0f0]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reports List */}
          <div className="mx-auto mt-6 w-full max-w-[1174px] overflow-hidden rounded-[15px] shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)]">
            {reportEntries.map((entry, i) => (
              <div
                key={i}
                className={`px-8 py-4 ${i % 2 === 0 ? "bg-[rgba(237,237,237,0.4)]" : "bg-[rgba(237,237,237,0.15)]"}`}
              >
                <p className="body-font text-[20px] text-[#645e5e]">
                  <span className="font-semibold text-black">{entry.category} </span>
                  - {entry.text}
                </p>
              </div>
            ))}
          </div>

          {/* Report Analysis */}
          <div className="mx-auto mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(237,237,237,0.2)] p-10 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.15)]">
            <h2 className="heading-font text-center text-[clamp(28px,3.5vw,40px)] font-semibold text-[rgba(17,17,17,0.8)]">
              Report analysis
            </h2>

            <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-center">
              {/* Bars */}
              <div className="flex flex-1 flex-col gap-4">
                {analysisBreakdown.map((b) => (
                  <div
                    key={b.label}
                    className="h-[54px] rounded-full transition-all duration-500"
                    style={{
                      width: `${(b.count / maxCount) * 100}%`,
                      backgroundColor: b.color,
                    }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-4">
                {analysisBreakdown.map((b) => (
                  <p key={b.label} className="body-font flex items-center gap-3 text-[20px] text-[#645e5e]">
                    <span className="h-[14px] w-[14px] rounded-full" style={{ backgroundColor: b.color }} />
                    {b.label} - <span className="font-semibold text-black">{b.count}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Report Summary */}
          <div className="mx-auto mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(237,237,237,0.2)] p-10 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.15)]">
            <h2 className="heading-font text-center text-[clamp(28px,3.5vw,40px)] font-semibold text-[rgba(17,17,17,0.8)]">
              Report summary
            </h2>
            <div className="mt-8 flex flex-col gap-4">
              {summaryPoints.map((point) => (
                <p key={point.title} className="body-font text-[18px] text-[#645e5e]">
                  <span className="font-semibold text-black">{point.title} : </span>
                  {point.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}