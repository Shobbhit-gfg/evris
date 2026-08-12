"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("LOGIN DATA:", data);
      console.log("LOGIN ERROR:", error);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log("LOGIN SUCCESS");

      router.push("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex min-h-screen flex-col items-center px-4 pt-[168px]">
        <h1 className="heading-font text-[clamp(48px,7vw,72px)] font-semibold text-[#111111]">
          evris
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-[89px] flex w-full max-w-[584px] flex-col"
        >
          {/* Email */}
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="body-font text-[16px] font-medium text-[#59595e]"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@evris.com"
              className="body-font mt-1 h-[47px] w-full border-b border-[#e5e5e5] bg-[#f6f6f6] px-3 text-[16px] text-[#111111] outline-none placeholder:text-[#a0a0a0] focus:border-black"
            />
          </div>

          {/* Password */}
          <div className="mt-6 flex flex-col">
            <label
              htmlFor="password"
              className="body-font text-[16px] font-medium text-[#59595e]"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="body-font mt-1 h-[47px] w-full border-b border-[#e5e5e5] bg-[#f6f6f6] px-3 text-[16px] text-[#111111] outline-none placeholder:text-[#a0a0a0] focus:border-black"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="body-font mt-4 text-[14px] text-red-600">
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="body-font mt-11 flex h-[56px] w-full items-center justify-center rounded-full bg-black text-[20px] font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing In..." : "Log In"}
          </button>

          <Link
            href="/forgot-password"
            className="body-font mt-5 self-center text-[16px] font-medium text-[#6e6e73] transition hover:text-black"
          >
            Forgot Password ?
          </Link>
        </form>
      </main>

      <Footer />
    </>
  );
}