"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

function getBaseUrl(): string {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitSiteUrl) return explicitSiteUrl;

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleAuth = async (type: "LOGIN" | "SIGNUP") => {
    setLoading(true);
    setMessage("");

    const { error } =
      type === "LOGIN"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${getBaseUrl()}/`,
            },
          });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(type === "LOGIN" ? "Logged in!" : "Check your email for a link!");
      if (type === "LOGIN") router.push("/");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">Welcome</h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          <div className="flex gap-4">
            <button
              onClick={() => handleAuth("LOGIN")}
              disabled={loading}
              className="flex-1 rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign In
            </button>
            <button
              onClick={() => handleAuth("SIGNUP")}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 bg-white py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign Up
            </button>
          </div>
          {message ? (
            <p className="mt-2 text-center text-sm text-red-600">{message}</p>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 w-full text-sm font-medium text-slate-600 underline underline-offset-2 transition hover:text-slate-900"
          >
            Back to home
          </button>
        </div>
      </div>
    </main>
  );
}
