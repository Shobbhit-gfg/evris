"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";

const searchStats = [
  { label: "Faces Indexed", value: "1,543" },
  { label: "Today's Searches", value: "100" },
  { label: "Matches Found (30d)", value: "742" },
  { label: "Recognition Accuracy", value: "99.2%" },
];

const recentMatches = [
  { name: "Aarav Sharma", event: "CS/IT Orientation", match: "98%", color: "#30bcc3" },
  { name: "Priya Nair", event: "Resume Building Workshop", match: "96%", color: "#1a8287" },
  { name: "Rohan Gupta", event: "TATVA 2K26", match: "94%", color: "#123c3e" },
  { name: "Ishita Verma", event: "Farewell 2026", match: "99%", color: "#30bcc3" },
  { name: "Kabir Singh", event: "Nasha Mukt Yuva", match: "91%", color: "#1a8287" },
  { name: "Sana Khan", event: "Fest & Concerts", match: "97%", color: "#123c3e" },
];

export default function AdminFindMePage() {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith("image/")) {
      setSelfie(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleUploadSearch = () => {
    if (!selfie) {
      fileInputRef.current?.click();
      return;
    }
    // TODO: wire up to real face-search API once backend exists
    alert(`Searching for matches using "${selfie.name}"...`);
  };

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4 pb-20">
          <AdminNavbar />

          <h1 className="heading-font mx-auto mt-8 w-full max-w-[1174px] text-[clamp(32px,4vw,45px)] font-semibold text-[#121212]">
            AI Face Search
          </h1>

          <div className="mx-auto mt-6 flex w-full max-w-[1174px] flex-col gap-8 lg:flex-row">

            {/* Search by Photo */}
            <div className="flex-1 rounded-[44px] bg-[rgba(237,237,237,0.6)] p-8">
              <h2 className="heading-font border-b border-[#dcdcdc] pb-5 text-center text-[24px] font-semibold text-[#121212]">
                Search by Photo
              </h2>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  mt-8 flex h-[240px] cursor-pointer flex-col items-center justify-center gap-4
                  rounded-[28px] border-[1.5px] border-dashed bg-white transition-colors
                  ${isDragging ? "border-black bg-[#f5f5f5]" : "border-[#b3b3b3]"}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />

                {selfie ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative h-[90px] w-[90px] overflow-hidden rounded-full">
                      <Image
                        src={URL.createObjectURL(selfie)}
                        alt="Selfie preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="body-font text-[16px] text-[#737378]">{selfie.name}</p>
                  </div>
                ) : (
                  <>
                    <div className="h-[90px] w-[90px] rounded-full bg-[#30bcc3]" />
                    <p className="body-font px-6 text-center text-[18px] text-[#737378]">
                      Drag & drop a selfie, or click to upload
                    </p>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleUploadSearch}
                  className="body-font flex h-[55px] items-center justify-center rounded-full bg-black px-8 text-[18px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                >
                  Upload & Search
                </button>
              </div>
            </div>

            {/* Search Stats */}
            <div className="w-full rounded-[44px] bg-[rgba(237,237,237,0.6)] p-8 lg:w-[420px]">
              <h2 className="heading-font border-b border-[#dcdcdc] pb-5 text-center text-[24px] font-semibold text-[#121212]">
                Search Stats
              </h2>
              <div className="mt-6 flex flex-col gap-5">
                {searchStats.map((stat) => (
                  <p key={stat.label} className="body-font flex items-center gap-3 text-[20px] text-[#333]">
                    <span className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#30bcc3]" />
                    {stat.label} <span className="font-semibold text-[#121212]">{stat.value}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Matches */}
          <h2 className="heading-font mx-auto mt-14 w-full max-w-[1174px] text-[clamp(28px,3.5vw,36px)] font-semibold text-[#121212]">
            Recent Matches
          </h2>
          <div className="mx-auto mt-6 w-full max-w-[1174px] rounded-[44px] bg-[#eaeaea] p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentMatches.map((m) => (
                <div key={m.name} className="overflow-hidden rounded-[24px] bg-white p-5">
                  <div
                    className="relative h-[140px] w-full rounded-[18px]"
                    style={{ backgroundColor: m.color }}
                  >
                    <span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#121212]">
                      {m.match}
                    </span>
                  </div>
                  <p className="body-font mt-4 text-[17px] font-medium text-[#121212]">{m.name}</p>
                  <p className="body-font text-[14px] text-[#808080]">{m.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}