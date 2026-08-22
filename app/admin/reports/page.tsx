"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";
import { supabase } from "@/lib/supabase";

type ReportEntry = {
  id: string;
  category: string;
  subject: string;
  email: string;
  description: string;
  status: string | null;
  created_at: string;
};

type AnalysisSegment = {
  label: string;
  value: number;
  color: string;
};

type ReportSummaryPoint = {
  title: string;
  text: string;
};

export default function AdminReportsPage() {
  const [monthIndex, setMonthIndex] = useState(7); // August
  const [isOpen, setIsOpen] = useState(false);

  const [reportEntries, setReportEntries] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [analysisBreakdown, setAnalysisBreakdown] = useState<
    AnalysisSegment[]
  >([
    {
      label: "User experience",
      value: 0,
      color: "#30bcc3",
    },
    {
      label: "Facial Recognition",
      value: 0,
      color: "#123c3e",
    },
    {
      label: "Others",
      value: 0,
      color: "#1a8287",
    },
  ]);

  const [summaryPoints, setSummaryPoints] = useState<ReportSummaryPoint[]>([
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
      text: 'Analysis of specialized tools, including facial search and profile matching ("Find Me").',
    },
    {
      title: "Action Items & Resolution Plan",
      text: "Targeted fixes and UI updates scheduled for immediate deployment.",
    },
  ]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data: reports, error: reportsError } = await supabase
        .from("reports")
        .select(
          "id, category, subject, email, description, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (reportsError) {
        console.error("Fetch reports error:", reportsError);
        setErrorMessage(reportsError.message);
        return;
      }

      const formattedReports: ReportEntry[] = reports || [];

      setReportEntries(formattedReports);

      // -----------------------------------------
      // Category analysis
      // -----------------------------------------

      const uxCount = formattedReports.filter(
        (report) => report.category === "user_experience"
      ).length;

      const facialRecognitionCount = formattedReports.filter(
        (report) => report.category === "facial_recognition"
      ).length;

      const otherCount = formattedReports.filter(
        (report) => report.category === "other"
      ).length;

      const total = formattedReports.length;

      setAnalysisBreakdown([
        {
          label: "User experience",
          value: uxCount,
          color: "#30bcc3",
        },
        {
          label: "Facial Recognition",
          value: facialRecognitionCount,
          color: "#123c3e",
        },
        {
          label: "Others",
          value: otherCount,
          color: "#1a8287",
        },
      ]);

      // -----------------------------------------
      // Dynamic summary
      // -----------------------------------------

      setSummaryPoints([
        {
          title: "Category Overview & Totals",
          text: `Quantified count of total reports submitted across active categories. Total: ${total} report${
            total === 1 ? "" : "s"
          }.`,
        },
        {
          title: "High-Priority Feedback Insights",
          text: `Key trends observed within the User Experience segment with ${uxCount} report${
            uxCount === 1 ? "" : "s"
          }.`,
        },
        {
          title: "Secondary Feature Performance",
          text: `Analysis of facial recognition and profile matching related reports with ${facialRecognitionCount} report${
            facialRecognitionCount === 1 ? "" : "s"
          }.`,
        },
        {
          title: "Action Items & Resolution Plan",
          text: `Targeted fixes and UI updates scheduled for review. ${total} total report${
            total === 1 ? "" : "s"
          } currently submitted.`,
        },
      ]);
    } catch (err) {
      console.error("Error fetching reports data:", err);

      setErrorMessage("Unable to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "user_experience":
        return "User Experience";

      case "facial_recognition":
        return "Facial Recognition";

      case "other":
        return "Other";

      default:
        return category;
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) {
      return "Pending";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4 pb-20">
          <AdminNavbar />

          {/* Month selector */}
          <div className="relative mx-auto mt-8 w-full max-w-[1174px]">
            <button
              onClick={() => setIsOpen((value) => !value)}
              className="flex h-[89px] w-full items-center justify-between rounded-[15px] bg-[rgba(237,237,237,0.4)] px-8 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.15)]"
            >
              <p className="body-font text-[28px] text-[#4b4b56]">
                {months[monthIndex]}{" "}
                <span className="font-semibold text-black">2026</span>
              </p>

              <ChevronDown
                className={`h-6 w-6 text-[#4b4b56] transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-[15px] bg-white p-4 shadow-lg">
                <div className="grid grid-cols-3 gap-2">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => {
                        setMonthIndex(index);
                        setIsOpen(false);
                      }}
                      className={`body-font rounded-lg px-3 py-2 text-[16px] transition ${
                        index === monthIndex
                          ? "bg-black text-white"
                          : "text-[#4b4b56] hover:bg-[#f0f0f0]"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mx-auto mt-6 w-full max-w-[1174px] rounded-[15px] border border-red-200 bg-red-50 px-6 py-4">
              <p className="body-font text-[15px] text-red-600">
                {errorMessage}
              </p>

              <button
                onClick={fetchReportsData}
                className="body-font mt-3 rounded-full bg-black px-5 py-2 text-[14px] font-medium text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Reports List */}
          <div className="mx-auto mt-6 w-full max-w-[1174px] overflow-hidden rounded-[15px] shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)]">
            {loading ? (
              <div className="bg-[rgba(237,237,237,0.4)] px-8 py-8">
                <p className="body-font text-[18px] text-[#737378]">
                  Loading reports...
                </p>
              </div>
            ) : reportEntries.length === 0 ? (
              <div className="bg-[rgba(237,237,237,0.4)] px-8 py-10 text-center">
                <p className="body-font text-[20px] font-semibold text-[#111111]">
                  No reports yet
                </p>

                <p className="body-font mt-2 text-[15px] text-[#737378]">
                  Reports submitted from the client page will appear here.
                </p>
              </div>
            ) : (
              reportEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`px-8 py-5 ${
                    index % 2 === 0
                      ? "bg-[rgba(237,237,237,0.4)]"
                      : "bg-[rgba(237,237,237,0.15)]"
                  }`}
                >
                  {/* Subject */}
                  <p className="body-font text-[20px] text-[#645e5e]">
                    <span className="font-semibold text-black">
                      {entry.subject}
                    </span>
                  </p>

                  {/* Description */}
                  <p className="body-font mt-2 text-[16px] leading-7 text-[#645e5e]">
                    {entry.description}
                  </p>

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="body-font rounded-full bg-[#30bcc3]/10 px-3 py-1 text-[13px] font-medium text-[#123c3e]">
                      {getCategoryLabel(entry.category)}
                    </span>

                    <span className="body-font text-[13px] text-[#737378]">
                      {entry.email}
                    </span>

                    <span className="body-font text-[13px] text-[#737378]">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>

                    <span className="body-font text-[13px] text-[#737378]">
                      Status:{" "}
                      <span className="font-semibold text-black">
                        {getStatusLabel(entry.status)}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Report Analysis */}
          <div className="mx-auto mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(237,237,237,0.2)] p-10 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.15)]">
            <h2 className="heading-font text-center text-[clamp(28px,3.5vw,40px)] font-semibold text-[rgba(17,17,17,0.8)]">
              Report analysis
            </h2>

            <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-center">
              {/* Bars */}
              <div className="flex flex-1 flex-col gap-4">
                {analysisBreakdown.map((breakdown) => {
                  const maxValue = Math.max(
                    ...analysisBreakdown.map((item) => item.value),
                    1
                  );

                  const width =
                    breakdown.value === 0
                      ? "0%"
                      : `${(breakdown.value / maxValue) * 100}%`;

                  return (
                    <div
                      key={breakdown.label}
                      className="h-[54px] rounded-full transition-all duration-500"
                      style={{
                        width,
                        backgroundColor: breakdown.color,
                      }}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-4">
                {analysisBreakdown.map((breakdown) => (
                  <p
                    key={breakdown.label}
                    className="body-font flex items-center gap-3 text-[20px] text-[#645e5e]"
                  >
                    <span
                      className="h-[14px] w-[14px] rounded-full"
                      style={{
                        backgroundColor: breakdown.color,
                      }}
                    />

                    {breakdown.label} -{" "}
                    <span className="font-semibold text-black">
                      {breakdown.value}
                    </span>
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
                <p
                  key={point.title}
                  className="body-font text-[18px] text-[#645e5e]"
                >
                  <span className="font-semibold text-black">
                    {point.title}:{" "}
                  </span>

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