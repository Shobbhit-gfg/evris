"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check, Sparkles } from "lucide-react";
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [analysisBreakdown, setAnalysisBreakdown] = useState<AnalysisSegment[]>([
    { label: "User experience", value: 0, color: "#30bcc3" },
    { label: "Facial Recognition", value: 0, color: "#123c3e" },
    { label: "Others", value: 0, color: "#1a8287" },
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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  useEffect(() => {
    fetchReportsData();
  }, []);

  // Helper function to recalculate graph & summary counts based on active (non-completed) reports
  const updateAnalysisState = (reports: ReportEntry[]) => {
    const activeReports = reports.filter((r) => r.status !== "completed");

    const uxCount = activeReports.filter((r) => r.category === "user_experience").length;
    const facialRecognitionCount = activeReports.filter((r) => r.category === "facial_recognition").length;
    const otherCount = activeReports.filter((r) => r.category === "other").length;
    const totalActive = activeReports.length;

    setAnalysisBreakdown([
      { label: "User experience", value: uxCount, color: "#30bcc3" },
      { label: "Facial Recognition", value: facialRecognitionCount, color: "#123c3e" },
      { label: "Others", value: otherCount, color: "#1a8287" },
    ]);

    setSummaryPoints([
      {
        title: "Category Overview & Totals",
        text: `Quantified count of pending reports across active categories. Total: ${totalActive} active report${totalActive === 1 ? "" : "s"}.`,
      },
      {
        title: "High-Priority Feedback Insights",
        text: `Key trends observed within the User Experience segment with ${uxCount} active report${uxCount === 1 ? "" : "s"}.`,
      },
      {
        title: "Secondary Feature Performance",
        text: `Analysis of facial recognition and profile matching related reports with ${facialRecognitionCount} active report${facialRecognitionCount === 1 ? "" : "s"}.`,
      },
      {
        title: "Action Items & Resolution Plan",
        text: `Targeted fixes and UI updates scheduled for review. ${totalActive} total active report${totalActive === 1 ? "" : "s"} currently pending.`,
      },
    ]);
  };

  const generateAISummary = async () => {
    try {
      setAiLoading(true);
      setAiError("");

      const response = await fetch("/api/ai/report-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports: reportEntries }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setAiSummary(data.summary);
    } catch (error) {
      console.error("AI Summary Error:", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate AI summary");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data: reports, error: reportsError } = await supabase
        .from("reports")
        .select("id, category, subject, email, description, status, created_at")
        .order("created_at", { ascending: false });

      if (reportsError) {
        console.error("Fetch reports error:", reportsError);
        setErrorMessage(reportsError.message);
        return;
      }

      const formattedReports: ReportEntry[] = reports || [];
      setReportEntries(formattedReports);

      // Recalculate analysis counts (only active reports count towards graph)
      updateAnalysisState(formattedReports);
    } catch (err) {
      console.error("Error fetching reports data:", err);
      setErrorMessage("Unable to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (entry: ReportEntry) => {
    const nextStatus = entry.status === "completed" ? "pending" : "completed";
    setUpdatingId(entry.id);

    const { error } = await supabase
      .from("reports")
      .update({ status: nextStatus })
      .eq("id", entry.id);

    if (error) {
      console.error("Status update error:", error);
      setUpdatingId(null);
      return;
    }

    setReportEntries((prev) => {
      const updatedReports = prev.map((r) =>
        r.id === entry.id ? { ...r, status: nextStatus } : r
      );
      // Recalculate the bar chart and summary live
      updateAnalysisState(updatedReports);
      return updatedReports;
    });

    setUpdatingId(null);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "user_experience": return "User Experience";
      case "facial_recognition": return "Facial Recognition";
      case "other": return "Other";
      default: return category;
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return "Pending";
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
                {months[monthIndex]} <span className="font-semibold text-black">2026</span>
              </p>
              <ChevronDown className={`h-6 w-6 text-[#4b4b56] transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
                        index === monthIndex ? "bg-black text-white" : "text-[#4b4b56] hover:bg-[#f0f0f0]"
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
              <p className="body-font text-[15px] text-red-600">{errorMessage}</p>
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
                <p className="body-font text-[18px] text-[#737378]">Loading reports...</p>
              </div>
            ) : reportEntries.length === 0 ? (
              <div className="bg-[rgba(237,237,237,0.4)] px-8 py-10 text-center">
                <p className="body-font text-[20px] font-semibold text-[#111111]">No reports yet</p>
                <p className="body-font mt-2 text-[15px] text-[#737378]">
                  Reports submitted from the client page will appear here.
                </p>
              </div>
            ) : (
              reportEntries.map((entry, index) => {
                const isCompleted = entry.status === "completed";
                return (
                  <div
                    key={entry.id}
                    className={`flex items-start justify-between gap-6 px-8 py-5 ${index % 2 === 0 ? "bg-[rgba(237,237,237,0.4)]" : "bg-[rgba(237,237,237,0.15)]"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="body-font text-[20px] font-semibold text-black">
                        {entry.subject}
                      </p>
                      <p className="body-font mt-2 text-[16px] leading-7 text-[#645e5e]">
                        {entry.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="body-font rounded-full bg-[#30bcc3]/10 px-3 py-1 text-[13px] font-medium text-[#123c3e]">
                          {getCategoryLabel(entry.category)}
                        </span>
                        <span className="body-font text-[13px] text-[#737378]">{entry.email}</span>
                        <span className="body-font text-[13px] text-[#737378]">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                        <span className="body-font text-[13px] text-[#737378]">
                          Status:{" "}
                          <span className={`font-semibold ${isCompleted ? "text-[#30bcc3]" : "text-black"}`}>
                            {getStatusLabel(entry.status)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(entry)}
                      disabled={updatingId === entry.id}
                      className={`
                        body-font flex h-[44px] shrink-0 items-center gap-2 rounded-full px-5 text-[14px] font-medium
                        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]
                        disabled:opacity-50
                        ${isCompleted
                          ? "bg-[#30bcc3] text-white"
                          : "border-[1.5px] border-black bg-transparent text-[#121212] hover:bg-black hover:text-white"}
                      `}
                    >
                      <Check className="h-[15px] w-[15px]" />
                      {updatingId === entry.id ? "Saving..." : isCompleted ? "Completed" : "Mark as Done"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Report Analysis */}
          <div className="mx-auto mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(237,237,237,0.2)] p-10 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.15)]">
            <h2 className="heading-font text-center text-[clamp(28px,3.5vw,40px)] font-semibold text-[rgba(17,17,17,0.8)]">
              Report analysis
            </h2>
            <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col gap-4">
                {analysisBreakdown.map((breakdown) => {
                  const maxValue = Math.max(...analysisBreakdown.map((item) => item.value), 1);
                  const width = breakdown.value === 0 ? "0%" : `${(breakdown.value / maxValue) * 100}%`;
                  return (
                    <div
                      key={breakdown.label}
                      className="h-[54px] rounded-full transition-all duration-500"
                      style={{ width, backgroundColor: breakdown.color }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-col gap-4">
                {analysisBreakdown.map((breakdown) => (
                  <p key={breakdown.label} className="body-font flex items-center gap-3 text-[20px] text-[#645e5e]">
                    <span className="h-[14px] w-[14px] rounded-full" style={{ backgroundColor: breakdown.color }} />
                    {breakdown.label} - <span className="font-semibold text-black">{breakdown.value}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* AI Generate Button */}
          <div className="mx-auto mt-8 flex w-full max-w-[1174px] flex-col items-center gap-4">
            {aiError && (
              <p className="body-font text-[15px] text-red-600">{aiError}</p>
            )}
            <button
              onClick={generateAISummary}
              disabled={aiLoading || reportEntries.length === 0}
              className="body-font flex h-[60px] items-center gap-2 rounded-full bg-black px-8 text-[18px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="h-[18px] w-[18px]" />
              {aiLoading ? "Generating AI Summary..." : "Generate AI Summary"}
            </button>
          </div>

          {/* Report Summary */}
          <div className="mx-auto mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(237,237,237,0.2)] p-10 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.15)]">
            <h2 className="heading-font text-center text-[clamp(28px,3.5vw,40px)] font-semibold text-[rgba(17,17,17,0.8)]">
              Report summary
            </h2>

            <div className="mt-8 flex flex-col gap-6">
              {aiSummary && (
                <div className="rounded-[24px] border border-[#30bcc3]/30 bg-white p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.06)]">
                  <span className="body-font inline-flex items-center gap-2 rounded-full bg-[#30bcc3]/10 px-4 py-2 text-[14px] font-medium text-[#123c3e]">
                    <Sparkles className="h-[14px] w-[14px]" />
                    AI Generated Summary
                  </span>
                  <p className="body-font mt-5 whitespace-pre-wrap text-[17px] leading-8 text-[#4b4b56]">
                    {aiSummary}
                  </p>
                </div>
              )}

              {summaryPoints.map((point) => (
                <p key={point.title} className="body-font text-[18px] leading-7 text-[#645e5e]">
                  <span className="font-semibold text-black">{point.title}: </span>
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