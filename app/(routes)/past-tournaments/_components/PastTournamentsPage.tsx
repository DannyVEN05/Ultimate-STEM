"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Calendar, Users } from "lucide-react";

interface Tournament {
  id: string;
  title: string;
  category: string;
  endDate: string;
  participants: number;
}

function formatDate(value: string): string {
  return value.slice(0, 10);
}

const EMOJI_MAP: Record<string, string> = {
  hydro: "💧", water: "💧", fluid: "💧",
  bot: "🤖", robot: "🤖", code: "🤖",
  chem: "⚗️",
  phys: "⚡", solar: "⚡", light: "⚡",
  math: "📐",
  geo: "🌍", earth: "🌍",
  bio: "🧬",
};

function getCategoryEmoji(category: string): string {
  const c = category.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (c.includes(key)) return emoji;
  }
  return "🔬";
}

const PastTournamentsPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("tournament")
      .select("tournament_id, tournament_title, tournament_genre, tournament_end_date, tournament_submission(count)")
      .eq("tournament_status", "concluded")
      .eq("tournament_submission.tournamentsub_status", "approved")
      .order("tournament_end_date", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); }
        else if (data) {
          setTournaments(data.map((row: any) => ({
            id: String(row.tournament_id),
            title: row.tournament_title,
            category: row.tournament_genre ?? "",
            endDate: row.tournament_end_date ?? "",
            participants: (row.tournament_submission?.[0]?.count ?? 0) as number,
          })));
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-black text-gray-900">Past Tournaments</h1>
        </div>
        <p className="text-gray-500 text-sm">A complete archive of all concluded STEM battles and their champions.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/5" />
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-16 text-center text-gray-400 text-sm">
          No concluded tournaments yet.
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map((t, i) => (
            <div
              key={t.id}
              className="rounded-xl border border-gray-100 bg-white p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Season badge */}
              <div className="shrink-0 h-14 w-14 rounded-xl bg-purple-50 flex flex-col items-center justify-center border border-purple-100">
                <span className="text-2xl leading-none">{getCategoryEmoji(t.category)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Season {tournaments.length - i}
                  </span>
                  {t.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t.category}</span>
                  )}
                </div>
                <h2 className="font-bold text-gray-900 mt-0.5 truncate">{t.title}</h2>
              </div>

              {/* Metadata */}
              <div className="shrink-0 flex flex-col sm:flex-row gap-4 text-xs text-gray-400">
                {t.endDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Ended {formatDate(t.endDate)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {t.participants} participants
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastTournamentsPage;
