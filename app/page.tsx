"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import { expandInterestTerms, normalizeInterest } from "@/utils/interestSynonyms";

type InterestRow = {
  id: string;
  name: string;
  user_id: string | null;
  user_email: string | null;
};

type CommunityTag = {
  key: string;
  name: string;
  emails: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInterestRow(value: unknown): value is InterestRow {
  if (!isRecord(value)) return false;
  const id = value.id;
  const name = value.name;
  const userId = value.user_id;
  const userEmail = value.user_email;
  return (
    typeof id === "string" &&
    typeof name === "string" &&
    (userId === null || typeof userId === "string") &&
    (userEmail === null || typeof userEmail === "string")
  );
}

function parseInterestsPayload(payload: unknown): InterestRow[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter(isInterestRow);
}

function getApiErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const err = data.error;
  return typeof err === "string" ? err : null;
}

function interestTitleCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildCommunityInterests(
  rows: InterestRow[],
  currentEmail: string | undefined,
): CommunityTag[] {
  const currentLower = currentEmail?.trim().toLowerCase() ?? "";
  const byName = new Map<string, { name: string; others: Map<string, string> }>();

  for (const row of rows) {
    const nameKey = row.name.toLowerCase();
    const display = (row.user_email?.trim() || "Anonymous");
    const norm = display.toLowerCase();
    if (currentLower && norm === currentLower) continue;

    let g = byName.get(nameKey);
    if (!g) {
      g = { name: row.name, others: new Map() };
      byName.set(nameKey, g);
    }
    if (!g.others.has(norm)) {
      g.others.set(norm, display);
    }
  }

  return Array.from(byName.entries())
    .filter(([, g]) => g.others.size > 0)
    .map(([key, g]) => ({
      key,
      name: g.name,
      emails: [...g.others.values()],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [interest, setInterest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [warning, setWarning] = useState("");
  const [allInterests, setAllInterests] = useState<InterestRow[]>([]);
  const [liveMatches, setLiveMatches] = useState<InterestRow[]>([]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/interests");
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      setAllInterests([]);
      return;
    }
    if (!res.ok) {
      setAllInterests([]);
      return;
    }
    setAllInterests(parseInterestsPayload(payload));
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void fetchData();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const fetchMatchesForInterest = useCallback(
    async (term: string) => {
      const expandedTerms = expandInterestTerms(term);
      if (!expandedTerms.length) {
        setLiveMatches([]);
        return;
      }

      const params = new URLSearchParams({
        interest: term,
      });

      if (user?.id) {
        params.set("excludeUserId", user.id);
      }

      const res = await fetch(`/api/interests?${params.toString()}`);
      let payload: unknown;
      try {
        payload = await res.json();
      } catch {
        setLiveMatches([]);
        return;
      }

      if (!res.ok) {
        setLiveMatches([]);
        return;
      }

      setLiveMatches(parseInterestsPayload(payload));
    },
    [user],
  );

  const myInterests = useMemo(() => {
    if (!user?.id) return [];
    return allInterests.filter((row) => row.user_id === user.id);
  }, [allInterests, user]);

  const myUniqueInterests = useMemo(() => {
    const uniqueByName = new Map<string, InterestRow>();
    for (const row of myInterests) {
      const normalized = normalizeInterest(row.name);
      if (!normalized || uniqueByName.has(normalized)) continue;
      uniqueByName.set(normalized, { ...row, name: normalized });
    }
    return [...uniqueByName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [myInterests]);

  const communityInterests = useMemo(
    () => buildCommunityInterests(allInterests, user?.email ?? undefined),
    [allInterests, user],
  );

  const typingMatch = useMemo(() => {
    const grouped = buildCommunityInterests(liveMatches, user?.email ?? undefined);
    return grouped.length > 0 ? grouped[0] : undefined;
  }, [liveMatches, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedInterest = normalizeInterest(interest);
    if (!normalizedInterest) {
      setWarning("");
      setIsSuccess(false);
      setMessage("Please enter an interest.");
      return;
    }

    if (!user?.id) {
      setIsSuccess(false);
      setMessage("Please sign in to add an interest.");
      return;
    }

    const value = normalizedInterest;
    const isDuplicate = myInterests.some(
      (row) => normalizeInterest(row.name) === value,
    );
    if (isDuplicate) {
      setWarning("You have already added this interest");
      setIsSuccess(false);
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setWarning("");

    try {
      const response = await fetch("/api/interests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interest: value,
          userId: user.id,
          userEmail: user.email ?? null,
        }),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        setIsSuccess(false);
        setMessage(
          getApiErrorMessage(data) ?? "Unable to save interest. Please try again.",
        );
        return;
      }

      await fetchData();
      setInterest("");
      setLiveMatches([]);
      setWarning("");
      setIsSuccess(true);
      setMessage("Interest saved successfully.");
    } catch {
      setIsSuccess(false);
      setMessage(
        "Something went wrong. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main className="flex min-h-dvh min-h-screen w-full items-center justify-center bg-slate-100 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="mx-auto w-full min-w-0 max-w-lg rounded-xl bg-white p-4 shadow-lg sm:rounded-2xl sm:p-6 md:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 border-b border-slate-200 pb-6">
          {user ? (
            <>
              <p className="text-center text-sm text-slate-600">
                <span className="font-medium text-slate-900">{user.email ?? user.id}</span>
              </p>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex w-full max-w-full justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-slate-700 sm:w-auto"
            >
              Login to add your own interests
            </Link>
          )}
        </div>

        <h1 className="text-center text-2xl font-semibold text-slate-900">Share an Interest</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Tell us something you are interested in.</p>

        {user ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                value={interest}
                onChange={(event) => {
                  const nextInterest = event.target.value;
                  setInterest(nextInterest);
                  setWarning("");
                  const normalizedTypingInterest = normalizeInterest(nextInterest);
                  if (!normalizedTypingInterest) {
                    setLiveMatches([]);
                    return;
                  }
                  void fetchMatchesForInterest(normalizedTypingInterest);
                }}
                placeholder="e.g. Hiking"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                disabled={isSubmitting}
              />
              {warning ? (
                <p className="mt-2 text-center text-sm text-red-600">{warning}</p>
              ) : null}
              {typingMatch ? (
                <p className="mt-2 text-center text-sm text-slate-600">
                  Great choice! {typingMatch.emails.length} verified user
                  {typingMatch.emails.length === 1 ? "" : "s"} share this interest.
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 min-h-[44px] w-full min-w-0 shrink-0 touch-manipulation items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-center text-base font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        ) : null}

        <div className="mt-8 flex w-full min-w-0 flex-col gap-6 sm:gap-8">
          <div className="w-full min-w-0 rounded-xl border-2 border-indigo-200 bg-indigo-50/80 p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
              My Interests
            </h2>
            <p className="mt-1 text-xs text-indigo-700/80">Personal</p>
            {myUniqueInterests.length > 0 ? (
              <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                {myUniqueInterests.map((row) => (
                  <li key={row.id}>
                    <span className="inline-flex items-center rounded-full border border-indigo-300 bg-white px-3 py-1 text-xs font-medium text-indigo-950 shadow-sm">
                      {row.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-indigo-800/90">No interests yet.</p>
            )}
          </div>

          <div className="w-full min-w-0 rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
              Community Matches
            </h2>
            <p className="mt-1 text-xs text-amber-800/80">Similar interests across the platform</p>
            {communityInterests.length > 0 ? (
              <ul className="mt-4 flex list-none flex-col gap-3 p-0">
                {communityInterests.map((row) => (
                  <li key={row.key} className="min-w-0">
                    <div className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-amber-950 shadow-sm">
                      <div className="font-semibold">{interestTitleCase(row.name)}</div>
                      <p className="mt-1 text-amber-900/90">Matching with:</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                          Verified User
                        </span>
                        <span className="text-[11px] text-amber-900/80">
                          x{row.emails.length}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-amber-900/90">No community interests yet.</p>
            )}
          </div>
        </div>

        {message ? (
          <p className={`mt-4 text-center text-sm ${isSuccess ? "text-emerald-600" : "text-red-600"}`}>
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
