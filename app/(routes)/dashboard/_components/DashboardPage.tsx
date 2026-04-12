"use client";

import { useEffect, useState, useContext } from "react";
import { supabase } from "@/lib/supabase";
import AuthContext from "@/app/_context/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Bell, FlaskConical, Zap, BookOpen, Mail } from "lucide-react";

type TournamentStatus = "upcoming" | "stage1" | "stage2" | "concluded" | "cancelled";

interface Tournament {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  participants: number;
  participantLimit: number;
  status: TournamentStatus;
}

function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
      });
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

function getCategoryIcon(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("hydro") || c.includes("water") || c.includes("fluid")) return "💧";
  if (c.includes("bot") || c.includes("robot") || c.includes("code")) return "🤖";
  if (c.includes("chem")) return "⚗️";
  if (c.includes("phys") || c.includes("solar") || c.includes("light")) return "⚡";
  if (c.includes("math")) return "📐";
  if (c.includes("geo") || c.includes("earth")) return "🌍";
  if (c.includes("bio")) return "🧬";
  return "🔬";
}

function getCategoryBg(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("hydro") || c.includes("water")) return "bg-blue-500";
  if (c.includes("bot") || c.includes("robot") || c.includes("code")) return "bg-orange-500";
  if (c.includes("chem")) return "bg-green-500";
  if (c.includes("phys") || c.includes("solar")) return "bg-yellow-500";
  if (c.includes("math")) return "bg-pink-500";
  if (c.includes("geo")) return "bg-teal-500";
  return "bg-purple-600";
}

function capacityPct(t: Tournament) {
  return t.participantLimit > 0 ? Math.min(100, Math.round((t.participants / t.participantLimit) * 100)) : 0;
}

function slotsLeft(t: Tournament) {
  return Math.max(0, t.participantLimit - t.participants);
}

function isEndingSoon(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 3600000;
}

const CHAMPION_EMOJIS = ["🏗️", "🤖", "🔍", "⚗️", "🌿", "⚡"];

interface UpcomingCardProps {
  t: Tournament;
  isNotified: boolean;
  isNotifying: boolean;
  onNotify: (id: string) => void;
}

function UpcomingCard({ t, isNotified, isNotifying, onNotify }: UpcomingCardProps) {
  const countdown = useCountdown(t.startDate);
  return (
    <div className="rounded-xl bg-green-50 border border-green-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 space-y-1 min-w-0">
        <span className="inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs font-bold text-green-700 uppercase tracking-wide">Coming Soon</span>
        <h3 className="text-base font-bold text-gray-900">Next drop: {t.title}</h3>
        {t.category && (
          <p className="text-sm text-gray-500">
            Get your concepts ready. {t.category} battle starts in {countdown.days}d {String(countdown.hours).padStart(2, "0")}h.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-center rounded-lg border border-green-200 bg-white px-3 py-2 min-w-[56px]">
          <p className="text-xl font-black text-gray-900">{String(countdown.days).padStart(2, "0")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">DAYS</p>
        </div>
        <div className="text-center rounded-lg border border-green-200 bg-white px-3 py-2 min-w-[56px]">
          <p className="text-xl font-black text-gray-900">{String(countdown.hours).padStart(2, "0")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">HOURS</p>
        </div>
      </div>

      {isNotified ? (
        <span className="shrink-0 flex items-center gap-1.5 rounded-lg bg-green-100 px-5 py-2.5 text-sm font-semibold text-green-700">
          <Bell className="h-4 w-4" />Notified
        </span>
      ) : (
        <button
          onClick={() => onNotify(t.id)}
          disabled={isNotifying}
          className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer disabled:cursor-default disabled:opacity-60"
        >
          {isNotifying
            ? "Saving…"
            : <span className="flex items-center gap-1.5"><Bell className="h-4 w-4" /> Notify Me</span>}
        </button>
      )}
    </div>
  );
}

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const active = tournaments.filter(t => t.status === "stage1" || t.status === "stage2");
  const upcoming = tournaments.filter(t => t.status === "upcoming");
  const concluded = tournaments.filter(t => t.status === "concluded");

  useEffect(() => {
    supabase
      .from("tournament")
      .select("tournament_id, tournament_title, tournament_genre, tournament_start_date, tournament_end_date, tournament_user_limit, tournament_status, tournament_submission(count)")
      .in("tournament_status", ["stage1", "stage2", "upcoming", "concluded"])
      .order("tournament_start_date", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setTournaments(data.map((row: any) => ({
            id: String(row.tournament_id),
            title: row.tournament_title,
            category: row.tournament_genre ?? "",
            startDate: row.tournament_start_date,
            endDate: row.tournament_end_date,
            participants: (row.tournament_submission?.[0]?.count ?? 0) as number,
            participantLimit: row.tournament_user_limit ?? 0,
            status: row.tournament_status as TournamentStatus,
          })));
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("expression_of_interest")
      .select("tournament_id")
      .eq("user_id", user.user_id)
      .then(({ data }) => {
        if (data) setNotifiedIds(new Set(data.map((r: any) => String(r.tournament_id))));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNotifyMe = async (tournamentId: string) => {
    if (!user) { router.push("/login"); return; }
    if (notifiedIds.has(tournamentId) || notifyingId === tournamentId) return;
    setNotifyingId(tournamentId);
    const { error } = await supabase
      .from("expression_of_interest")
      .insert({
        user_id: user.user_id,
        tournament_id: Number(tournamentId),
        eot_status: "interested",
      });
    if (error) {
      console.error("expression_of_interest insert failed:", error.message, error.details, error.hint);
    } else {
      setNotifiedIds(prev => new Set([...prev, tournamentId]));
    }
    setNotifyingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-16">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="flex flex-col lg:flex-row gap-10 items-center">
        <div className="flex-1 space-y-5">
          <h1 className="text-5xl font-black leading-tight tracking-tight text-gray-900">
            Where <span className="text-primary">Writing</span><br />
            meets <span className="text-tertiary">Science.</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-md">
            STEM Tournaments is the ultimate battleground for young scientists to design, build, and compete with their own tactile experiments. Join us in revolutionizing STEM education through hands-on creativity and fierce competition.
          </p>
        </div>

        <div className="flex-1 flex justify-center relative">
          <div className="relative w-full max-w-sm">
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-teal-900 to-slate-900 aspect-[4/3] flex items-end justify-start p-5 shadow-2xl">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-6 right-8 h-20 w-20 rounded-full border-2 border-white/40" />
                <div className="absolute top-14 right-16 h-10 w-10 rounded-full border border-white/30" />
                <div className="absolute bottom-8 left-6 h-14 w-14 rounded-full border border-white/20" />
              </div>
              <FlaskConical className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 text-white/20" />
              <p className="relative text-white/60 text-xs uppercase tracking-widest font-semibold">STEM Lab</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE BATTLES ───────────────────────────────────────── */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Active Battles</h2>
            <p className="text-gray-500 text-sm mt-0.5">Jump into the heat of the tournament right now.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-6">Loading battles…</div>
        ) : active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">
            No active battles right now — check upcoming tournaments below.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Featured card */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-2 flex-wrap">
                  {isEndingSoon(active[0].endDate) && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">Ending Soon</span>
                  )}
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {active[0].status === "stage1" ? "Stage 1" : "Stage 2"}
                  </span>
                </div>
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(3, active[0].participants) }).map((_, i) => (
                    <div key={i} className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  {active[0].participants > 3 && (
                    <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white text-[10px] text-gray-600 flex items-center justify-center font-bold">
                      +{active[0].participants - 3}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">{active[0].title}</h3>
                {active[0].category && (
                  <span className="inline-block mt-1 text-xs text-gray-500 font-medium">{active[0].category}</span>
                )}
              </div>

              <div className="space-y-1.5 mt-auto">
                <div className="flex justify-between text-xs">
                  <span className="text-primary font-semibold">{capacityPct(active[0])}% Capacity reached</span>
                  <span className="text-gray-500">{slotsLeft(active[0])} Slots left</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${capacityPct(active[0])}%` }} />
                </div>
              </div>

              <button
                onClick={() => router.push("/dashboard/tournament")}
                className="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Join Now
              </button>
            </div>

            {/* Sidebar cards */}
            <div className="flex flex-col gap-4">
              {active.slice(1, 3).map(t => (
                <div key={t.id} className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-3 shadow-sm">
                  <div className={`h-9 w-9 rounded-xl ${getCategoryBg(t.category)} flex items-center justify-center text-lg`}>
                    {getCategoryIcon(t.category)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{t.title}</p>
                    {t.category && <p className="text-xs text-gray-500 mt-0.5">{t.category}</p>}
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/tournament")}
                    className={`w-full rounded-lg py-2 text-xs font-semibold text-white ${getCategoryBg(t.category)} hover:opacity-90 transition-opacity cursor-pointer`}
                  >
                    Join Now
                  </button>
                </div>
              ))}

              {active.length === 1 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 text-gray-400 flex-1 min-h-[100px]">
                  <Zap className="h-5 w-5 opacity-30" />
                  <p className="text-xs text-center">More battles coming soon</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── UPCOMING TOURNAMENTS ─────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Tournaments</h2>
            <p className="text-gray-500 text-sm mt-0.5">Register your interest - be the first notified when doors open.</p>
          </div>

          <div className="space-y-4">
            {upcoming.map((t) => (
              <UpcomingCard
                key={t.id}
                t={t}
                isNotified={notifiedIds.has(t.id)}
                isNotifying={notifyingId === t.id}
                onNotify={handleNotifyMe}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── HALL OF CHAMPIONS ────────────────────────────────────── */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900">Hall of Past Tournaments</h2>
          <p className="text-gray-500 mt-2 text-sm">Celebrating the brilliant minds who pushed the boundaries of tactile science.</p>
        </div>

        {!loading && concluded.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">No concluded tournaments yet — check back soon.</div>
        ) : (
          <div className={`grid gap-5 grid-cols-1 sm:grid-cols-2 ${
            concluded.length === 0 ? "lg:grid-cols-1" :
            concluded.length === 1 ? "lg:grid-cols-2" :
            concluded.length === 2 ? "lg:grid-cols-3" :
            "lg:grid-cols-4"
          }`}>
            {concluded.slice(0, 3).map((t, i) => (
              <div key={t.id} className="rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                <div className={`aspect-[4/3] flex items-center justify-center text-5xl ${["bg-orange-100", "bg-slate-700", "bg-stone-200"][i % 3]}`}>
                  {CHAMPION_EMOJIS[i % CHAMPION_EMOJIS.length]}
                </div>
                <div className="p-4 space-y-1">
                  <span className={`text-xs font-bold uppercase tracking-widest ${i % 2 === 0 ? "text-primary" : "text-tertiary"}`}>
                    Season {concluded.length - i} 
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">{t.title}</h3>
                  {t.category && <p className="text-xs text-gray-500">{t.category}</p>}
                </div>
              </div>
            ))}

            {/* Discover More */}
            <div
              className="rounded-xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-primary/40 transition-colors min-h-[200px]"
              onClick={() => router.push("/past-tournaments")}
            >
              <BookOpen className="h-10 w-10 text-primary/50" />
              <div>
                <p className="font-bold text-gray-800 text-sm">Discover More</p>
                <p className="text-xs text-gray-500 mt-0.5">Explore all archived student projects.</p>
              </div>
              <span className="text-sm font-semibold text-primary hover:underline">Open Archives</span>
            </div>
          </div>
        )}
      </section>

      {/* ── TOURNAMENT IDEA CARD ─────────────────────────────────── */}
      <section>
        <div className="rounded-2xl bg-primary px-8 py-12 flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1 space-y-5 text-white">
            <div>
              <h2 className="text-3xl font-black leading-tight">
                Got a Brilliant<br />
                <span className="text-tertiary underline underline-offset-4 decoration-tertiary/70">STEM Idea?</span>
              </h2>
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Every great battle starts with a spark. Share your tournament idea by sending an email to our team — we read every submission.
            </p>
            <div className="space-y-2">
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Send your idea to</p>
              <a
                href="mailto:stemtournaments@info.com.au"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-white/90 transition-colors"
              >
                <Mail className="h-4 w-4 text-primary shrink-0" />
                stemtournaments@info.com.au
              </a>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="rounded-2xl bg-white/10 border border-white/20 px-6 py-5 space-y-4 max-w-xs w-full text-white">
              {[
                ["1", "Describe the Tournament"],
                ["2", "Give it a Catchy Name"],
                ["3", "Set the Battle Rules"],
              ].map(([num, label]) => (
                <div key={num} className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">{num}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default DashboardPage;