"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import AdminNavbar from "@/components/layout/adminnavbar";

export default function AdminPage() {
  const [stats, setStats] = useState({
    events: 0,
    photos: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: eventCount } = await supabase
      .from("events")
      .select("*", {
        count: "exact",
        head: true,
      });

    const { count: photoCount } = await supabase
      .from("photos")
      .select("*", {
        count: "exact",
        head: true,
      });

    setStats({
      events: eventCount || 0,
      photos: photoCount || 0,
    });
  };

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4">
          <AdminNavbar />

          <div className="mx-auto mt-10 max-w-6xl">
            <h1 className="text-4xl font-semibold">
              Dashboard
            </h1>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-8 shadow">
                <h2 className="text-lg text-gray-500">
                  Total Events
                </h2>

                <p className="mt-2 text-5xl font-bold">
                  {stats.events}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow">
                <h2 className="text-lg text-gray-500">
                  Total Photos
                </h2>

                <p className="mt-2 text-5xl font-bold">
                  {stats.photos}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}