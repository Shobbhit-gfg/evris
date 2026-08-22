"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const categories = [
  {
    id: "user_experience",
    title: "User Experience",
    description: "Navigation, design, or usability issues",
    color: "#30bcc3",
  },
  {
    id: "facial_recognition",
    title: "Facial Recognition",
    description: "Face search accuracy or matching issues",
    color: "#1a8287",
  },
  {
    id: "other",
    title: "Other",
    description: "Anything else you'd like us to know",
    color: "#123c3e",
  },
];

export default function SubmitReportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("user_experience");
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("reports").insert([
      {
        category,
        subject,
        email,
        description,
      },
    ]);

    if (error) {
      console.log("SUPABASE ERROR:", JSON.stringify(error, null, 2));
      setMessage(JSON.stringify(error));
      setLoading(false);
      return;
    }

    // TODO: once report-attachments storage is set up, upload `attachment`
    // and link it to this report before redirecting.

    setMessage("Report submitted — thank you!");
    setTimeout(() => {
      router.push("/");
    }, 1200);
  };

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4 pb-20">
          <div className="mx-auto mt-8 w-full max-w-[1174px]">

            <h1 className="heading-font text-[clamp(36px,5.5vw,56px)] font-semibold text-[#111111]">
              Submit a Report
            </h1>
            <p className="body-font mt-3 text-[clamp(17px,2vw,24px)] text-[#737378]">
              Run into an issue or have feedback? Let us know and our team will look into it.
            </p>

            <form onSubmit={handleSubmit}>

              {/* Step 1 */}
              <p className="body-font mt-14 text-[16px] font-semibold uppercase tracking-[1.5px] text-[#30bcc3]">
                Step 1
              </p>
              <h2 className="body-font mt-2 text-[28px] font-semibold text-[#121212]">
                Select a Category
              </h2>

              <div className="mt-6 flex flex-wrap gap-6">
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`
                        relative h-[150px] w-full max-w-[370px] flex-1 rounded-[24px] p-6 text-left transition-all duration-200
                        ${isSelected ? "bg-[#111111] border-2 border-[#30bcc3]" : "bg-[rgba(237,237,237,0.6)] border-2 border-transparent hover:border-[#d0d0d0]"}
                      `}
                    >
                      <span
                        className="block h-[40px] w-[40px] rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <p className={`body-font mt-4 text-[19px] font-semibold ${isSelected ? "text-white" : "text-[#1a1a1a]"}`}>
                        {cat.title}
                      </p>
                      <p className={`body-font mt-1 text-[14px] ${isSelected ? "text-[#cccccf]" : "text-[#808080]"}`}>
                        {cat.description}
                      </p>

                      {isSelected && (
                        <span className="absolute right-[18px] top-[18px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#30bcc3] text-[13px] font-semibold text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step 2 */}
              <p className="body-font mt-14 text-[16px] font-semibold uppercase tracking-[1.5px] text-[#30bcc3]">
                Step 2
              </p>
              <h2 className="body-font mt-2 text-[32px] font-semibold text-[#121212]">
                Report Details
              </h2>

              <div className="mt-6 rounded-[44px] bg-[rgba(237,237,237,0.6)] p-10">
                <div className="flex flex-col">
                  <label className="body-font text-[20px] font-medium text-[#66666b]">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    required
                    className="body-font mt-2 h-[34px] w-full border-b border-black/5 bg-[#f6f6f6] px-2 text-[18px] text-[#121212] outline-none placeholder:text-[#a6a6a6] focus:border-black"
                  />
                </div>

                <div className="mt-8 flex flex-col">
                  <label className="body-font text-[20px] font-medium text-[#66666b]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="body-font mt-2 h-[32px] w-full border-b border-black/5 bg-[#f6f6f6] px-2 text-[18px] text-[#121212] outline-none placeholder:text-[#a6a6a6] focus:border-black"
                  />
                </div>

                <div className="mt-8 flex flex-col">
                  <label className="body-font text-[20px] font-medium text-[#66666b]">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in as much detail as possible..."
                    required
                    className="body-font mt-2 h-[220px] w-full resize-none rounded-[20px] border border-black/10 bg-[#f6f6f6] p-4 text-[18px] text-[#121212] outline-none placeholder:text-[#a6a6a6] focus:ring-1 focus:ring-black"
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="body-font mt-8 flex h-[60px] w-fit items-center justify-center rounded-full border-[1.5px] border-black px-[22px] text-[20px] font-medium text-[#121212] transition hover:bg-black hover:text-white"
                >
                  📎&nbsp;&nbsp;{attachment ? attachment.name : "Attach a screenshot (optional)"}
                </button>
              </div>

              {message && (
                <p className="body-font mt-6 text-[15px] text-[#737378]">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="body-font mt-10 flex h-[78px] items-center justify-center rounded-full bg-black px-10 text-[20px] font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}