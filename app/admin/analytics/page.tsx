"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";

type AnalysisSegment = { label: string; value: number; color: string };

type StatTile = {
  label: string;
  value: string | number;
};

type DayIndex = {
  day: string;
  value: number;
};

type RecentActivityItem = {
  id: string;
  text: string;
  time: string;
};

function buildConicGradient(segments: AnalysisSegment[]) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  if (total === 0) return "conic-gradient(#e5e5e5 0% 100%)";

  let cursor = 0;
  const stops = segments.map((seg) => {
    const start = cursor;
    const percentage = (seg.value / total) * 100;
    cursor += percentage;
    return `${seg.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [statTiles, setStatTiles] = useState<StatTile[]>([
    { label: "Total Users", value: "0" },
    { label: "Total Events", value: "0" },
    { label: "Indexed Photos", value: "0" },
    { label: "Total Matches", value: "0" },
  ]);

  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisSegment[]>([
    { label: "Standard Users", value: 0, color: "#30bcc3" },
    { label: "Admins", value: 0, color: "#1a8287" },
  ]);

  const [faceIndexByDay, setFaceIndexByDay] = useState<DayIndex[]>([
    { day: "Sun", value: 0 },
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
  ]);

  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

  const fetchAnalytics = async () => {
    try {
      // 1. Fetch High Level Counts
      const [
        { count: userCount },
        { count: eventCount },
        { count: photoCount },
        { count: matchCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("event_photos").select("*", { count: "exact", head: true }),
        supabase.from("face_matches").select("*", { count: "exact", head: true }),
      ]);

      setStatTiles([
        { label: "Total Users", value: (userCount || 0).toLocaleString() },
        { label: "Total Events", value: (eventCount || 0).toLocaleString() },
        { label: "Indexed Photos", value: (photoCount || 0).toLocaleString() },
        { label: "Total Matches", value: (matchCount || 0).toLocaleString() },
      ]);

      // 2. Fetch User Role Breakdown
      const { data: profiles } = await supabase.from("profiles").select("role");
      let admins = 0;
      let users = 0;

      profiles?.forEach((p) => {
        if (p.role === "admin") admins++;
        else users++;
      });

      setActiveAnalysis([
        { label: "Standard Users", value: users, color: "#30bcc3" },
        { label: "Admins", value: admins, color: "#1a8287" },
      ]);

      // 3. Fetch Recent Face Searches (Last 7 days calculation)
      const { data: matches } = await supabase
        .from("face_matches")
        .select("created_at");

      const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun - Sat
      matches?.forEach((m) => {
        if (m.created_at) {
          const dayIndex = new Date(m.created_at).getDay();
          dayCounts[dayIndex] += 1;
        }
      });

      const daysLabel = ["S", "M", "T", "W", "T", "F", "S"];
      setFaceIndexByDay(
        daysLabel.map((day, idx) => ({
          day,
          value: dayCounts[idx],
        }))
      );

      // 4. Fetch Recent Activity Logs
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (logs) {
        setRecentActivity(
          logs.map((log) => ({
            id: log.id,
            text: log.action || log.description,
            time: new Date(log.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Setup Realtime Subscription for Live Updates
    const channel = supabase
      .channel("analytics_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_logs" },
        () => fetchAnalytics()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => fetchAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const maxBar = Math.max(...faceIndexByDay.map((d) => d.value), 1);

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4">
          <AdminNavbar />

          {/* User Analytics Card */}
          <div className="mx-auto mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(217,217,217,0.2)] p-10 shadow-[0px_4px_66.6px_0px_rgba(0,0,0,0.15)]">
            <h1 className="heading-font text-[clamp(36px,4.5vw,56px)] font-semibold text-[#111111]">
              User analytics
            </h1>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {statTiles.map((tile) => (
                <div key={tile.label} className="flex flex-col gap-3 rounded-[24px] bg-white p-7">
                  <p className="body-font flex items-center gap-2 text-[16px] text-[#737378]">
                    <span className="h-[10px] w-[10px] rounded-full bg-[#30bcc3]" />
                    {tile.label}
                  </p>
                  <p className="body-font text-[32px] font-semibold text-[#121212]">
                    {loading ? "..." : tile.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Analysis + AI Face Index */}
          <div className="mx-auto mt-8 flex w-full max-w-[1174px] flex-col gap-8 lg:flex-row">
            {/* Active Analysis Donut Chart */}
            <div className="w-full rounded-[44px] bg-[rgba(237,237,237,0.4)] p-8 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)] lg:w-[391px]">
              <h2 className="body-font border-b border-[#dcdcdc] pb-4 text-center text-[24px] text-[#645e5e]">
                Active Analysis
              </h2>

              <div className="mt-8 flex justify-center">
                <div
                  className="relative flex h-[220px] w-[220px] items-center justify-center rounded-full transition-all duration-500"
                  style={{ background: buildConicGradient(activeAnalysis) }}
                >
                  <div className="h-[120px] w-[120px] rounded-full bg-white shadow-inner" />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {activeAnalysis.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-3">
                    <span
                      className="h-[20px] w-[20px] rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="body-font text-[20px] text-[#645e5e]">
                      {seg.label} ({seg.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Face Index Bar Chart */}
            <div className="flex-1 rounded-[44px] bg-[rgba(237,237,237,0.4)] p-8 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)]">
              <h2 className="body-font border-b border-[#dcdcdc] pb-4 text-center text-[24px] text-[#645e5e]">
                Ai- Face index
              </h2>
              <div className="mt-10 flex h-[220px] items-end justify-between gap-3 px-2">
                {faceIndexByDay.map((d, index) => {
                  const percentage = Math.min((d.value / maxBar) * 85, 85);
                  return (
                    <div key={`${d.day}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                      <div className="relative flex h-[180px] w-[40px] items-end justify-center rounded-full bg-[#d9d9d9]">
                        <span
                          className="absolute h-[24px] w-[24px] rounded-full bg-[#30bcc3] transition-all duration-500"
                          style={{ bottom: `${percentage}%` }}
                        />
                      </div>
                      <span className="body-font text-[18px] text-[#565050]">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="body-font mt-6 flex items-center justify-center gap-2 text-[18px] text-[#645e5e]">
                <span className="h-[16px] w-[16px] rounded-full bg-[#30bcc3]" />
                Average maximum face indexes
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mx-auto mb-20 mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(237,237,237,0.4)] p-10 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)]">
            <h2 className="heading-font text-[28px] font-semibold text-[#121212]">
              Recent Activity
            </h2>
            <div className="mt-6 flex flex-col gap-5">
              {recentActivity.length === 0 ? (
                <p className="body-font text-[16px] text-[#8c8c8c]">No recent activity logs recorded.</p>
              ) : (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <p className="body-font flex items-center gap-3 text-[16px] text-[#262629]">
                      <span className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#30bcc3]" />
                      {item.text}
                    </p>
                    <span className="body-font shrink-0 text-[14px] text-[#8c8c8c]">
                      {item.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}