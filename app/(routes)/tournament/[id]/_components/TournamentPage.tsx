"use client";

import TournamentContext from "@/app/_context/tournament/TournamentContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/app/_types/model/Concept";
import {
  formatCountdownParts,
  getCountdownParts,
  getTournamentMilestoneTarget,
  resolveTournamentLifecycleStatus,
  TournamentLifecycleStatus,
} from "@/app/_utilities/tournamentLifecycle";

type Tournament = {
  tournament_id: number;
  tournament_title: string;
  tournament_genre: string;
  tournament_start_date: string;
  tournament_s2_start_date: string | null;
  tournament_status: string;
  tournament_end_date: string;
  description: string;
};

type ConceptSubmission = {
  tournamentsub_id: string;
  tournamentsub_likes: number;
  tournamentsub_status: string;
  concept: {
    concept_id: string;
    concept_title: string;
    concept_description: string;
    concept_genre: string;
    concept_status: string;
    concept_styling: string;
  };
};

const TournamentPage = ({ id, readonly = false }: { id: string; readonly?: boolean }) => {
  const router = useRouter();
  const { setTournament } = useContext(TournamentContext);

  const [tournamentData, setTournamentData] = useState<Tournament | null>(null);
  const [conceptSubmissions, setConceptSubmissions] = useState<ConceptSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const fetchTournamentData = useCallback(async () => {
    try {
      await supabase.rpc("advance_tournament_lifecycle", { p_tournament_id: Number(id) });
    } catch (e) {
      console.warn("Lifecycle update check failed:", e);
    }

    const { data, error } = await supabase
      .from("tournament")
      .select("*")
      .eq("tournament_id", Number(id))
      .single();

    if (error) {
      console.error("Error fetching tournament data:", error);
      setLoading(false);
      return;
    }

    setTournamentData(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setTournament(Number(id));
    fetchTournamentData();
  }, [fetchTournamentData, id, setTournament]);

  useEffect(() => {
    const getConceptSubmissions = async () => {
      const { data, error } = await supabase
        .from("tournament_submission")
        .select(`
          tournamentsub_id,
          tournamentsub_likes,
          tournamentsub_status,
          concept:concept_id (
            concept_id,
            concept_title,
            concept_description,
            concept_genre,
            concept_status,
            concept_styling
          )
        `)
        .eq("tournament_id", Number(id))
        .eq("tournamentsub_status", "approved")
        .not("tournamentsub_status", "eq", "deleted")
        .not("concept.concept_status", "eq", "deleted")
        .order("tournamentsub_created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching concept submissions:", error);
        return;
      }

      setConceptSubmissions((data ? (data as unknown as ConceptSubmission[]) : []));
    };

    if (tournamentData) {
      getConceptSubmissions();
    }
  }, [tournamentData, id]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!tournamentData) return;

    const timerId = window.setInterval(() => {
      fetchTournamentData();
    }, 30000);

    return () => window.clearInterval(timerId);
  }, [fetchTournamentData, tournamentData]);

  const resolvedStatus = useMemo<TournamentLifecycleStatus>(() => {
    return resolveTournamentLifecycleStatus(tournamentData, now);
  }, [now, tournamentData]);

  const totalCountdown = useMemo(() => {
    return getCountdownParts(
      tournamentData?.tournament_end_date ? new Date(tournamentData.tournament_end_date).getTime() : null,
      now,
    );
  }, [now, tournamentData?.tournament_end_date]);

  const milestone = useMemo(() => {
    return getTournamentMilestoneTarget(tournamentData, resolvedStatus);
  }, [resolvedStatus, tournamentData]);

  const milestoneCountdown = useMemo(() => {
    return getCountdownParts(milestone.targetMs, now);
  }, [milestone.targetMs, now]);

  const statusStyles: Record<TournamentLifecycleStatus, string> = {
    upcoming: "bg-[#fff7e6] text-[#b97805]",
    stage1: "bg-[#e0f0ff] text-[#1565c0]",
    stage2: "bg-[#ede9fe] text-[#6d3ef0]",
    concluded: "bg-[#e6f9f0] text-[#1a8a55]",
    terminated: "bg-[#f0f1f7] text-[#4b5563]",
  };

  if (loading) return <p>Loading tournament...</p>;

  if (!tournamentData) return <p>Tournament not found.</p>;

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl bg-[#baffe5af] px-10 py-12 shadow-lg">
          <div className={`mb-4 inline-block rounded-full px-4 py-1 text-sm font-bold ${statusStyles[resolvedStatus]}`}>
            {resolvedStatus.charAt(0).toUpperCase() + resolvedStatus.slice(1)} Tournament
          </div>

          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-purple-950">{tournamentData.tournament_title}</h1>
          <div className="mb-4 inline-block rounded-full bg-green-300 my-3 px-4 py-1 mr-4 text-sm font-bold text-green-900">
            {tournamentData.tournament_genre}
          </div>
          <div className="mb-4 inline-block rounded-full bg-purple-300 px-4 py-1 text-sm font-bold text-purple-900">
            {resolvedStatus.charAt(0).toUpperCase() + resolvedStatus.slice(1)}
          </div>

          <p className="max-w-3xl text-md text-gray-700">
            {resolvedStatus === "stage1" || resolvedStatus === "stage2"
              ? "Join as the most creative concepts face off in the ultimate STEM showdown! Vote for your favourite concepts to shape their future."
              : "Browse the concepts that competed in this concluded tournament."}
          </p>
        </section>

        {!readonly && resolvedStatus !== "concluded" && resolvedStatus !== "terminated" && (
          <section className="mt-10 rounded-[2rem] bg-[whitesmoke] px-8 py-10 text-center shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 text-left">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                  Live Tournament Clock
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#1d2436]">
                  Total and stage countdowns
                </h2>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#6b7490] shadow-sm">
                Auto-refreshes every 15s
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-purple-200 bg-purple-50 px-8 py-8 shadow-sm">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-purple-700">Tournament ends in</div>
                <div className="mt-3 text-4xl font-extrabold text-purple-900">{formatCountdownParts(totalCountdown)}</div>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-8 py-8 shadow-sm">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">{milestone.label}</div>
                <div className="mt-3 text-4xl font-extrabold text-emerald-900">{formatCountdownParts(milestoneCountdown)}</div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black">
                Concept Submissions
              </h2>
              <p className="text-md text-gray-600"> Review the latest {tournamentData.tournament_genre} submissions from our community!</p>
            </div>
            {!readonly && <Button className="bg-white hover:bg-slate-100 text-sm font-medium text-slate-700" onClick={() => {
              router.push(`/tournament/${id}/submissions`)
              window.scrollTo(0, 0);
            }}>
              View all submissions →
            </Button>}
          </div>

          {conceptSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conceptSubmissions.map((submission) => {
                const fallbackCoverUrl = "/covers/engineering.png";
                const fallbackStyling = { book_cover: fallbackCoverUrl } as BookCover;
                const rawConceptStyling = submission.concept.concept_styling as unknown;
                let styling: BookCover = fallbackStyling;

                if (typeof rawConceptStyling === "string") {
                  try {
                    const parsedStyling = JSON.parse(rawConceptStyling) as unknown;
                    if (parsedStyling && typeof parsedStyling === "object") {
                      styling = parsedStyling as BookCover;
                    }
                  } catch {
                    styling = fallbackStyling;
                  }
                } else if (rawConceptStyling && typeof rawConceptStyling === "object") {
                  styling = rawConceptStyling as BookCover;
                }

                const bookCover = typeof styling.book_cover === "string"
                  ? styling.book_cover
                  : fallbackStyling.book_cover;
                let coverUrl = fallbackCoverUrl;
                if (bookCover) {
                  const isLocalPath = bookCover.startsWith("/");
                  const isAbsoluteUrl = /^(https?:)?\/\//.test(bookCover);
                  if (isLocalPath || isAbsoluteUrl) {
                    coverUrl = bookCover;
                  } else {
                    const { data } = supabase.storage.from('book-covers').getPublicUrl(bookCover);
                    coverUrl = data?.publicUrl ?? fallbackCoverUrl;
                  }
                }

                return (
                  <div key={submission.tournamentsub_id} className="w-[280px] rounded-lg border border-gray-200 bg-[#baffe5af] p-4 shadow-lg hover:shadow-md transition-shadow flex flex-col">
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-3">
                      <img
                        src={coverUrl}
                        alt={`${submission.concept.concept_title} Book Cover`}
                        className="rounded-lg w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2 leading-tight truncate">{truncateText(submission.concept.concept_title, 50)}</h3>
                        <span className="inline-block rounded-full bg-blue-200 px-2 py-1 text-xs font-semibold text-blue-700">
                          {submission.concept.concept_genre}</span>
                      </div>

                      <p className="text-sm text-gray-700 mb-4 flex-1">{truncateText(submission.concept.concept_description, 25)}</p>

                      <div className="flex items-center justify-between mb-3 mt-auto">
                        <span className="text-lg font-semibold text-purple-600 flex-shrink-0"></span>

                        {!readonly && <Button onClick={() => router.push(`/tournament/${id}/submissions`)}
                          className="rounded-full bg-purple-600 text-sm py-2 hover:bg-primary text-white font-medium px-4"
                        >View
                        </Button>}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-gray-500">No concept submissions yet.</p>
            </div>
          )}
        </section>

        {!readonly && <section className="mt-10 rounded-2xl bg-primary px-10 py-12 shadow-lg text-center">
          <div className=" flex flex-col mb-4 text-left">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to enter the Tournament Bracket?</h2>
            <p className="text-md text-gray-100 mb-6">Join the fun and vote for your favourite concepts!</p>
          </div>

          <Button
            className="py-2 px-6 text-white bg-purple-600 hover:bg-purple-700"
            onClick={() => router.push(`/tournament/${id}/tournamentbracket`)}
          >
            Enter Tournament
          </Button>
        </section>}
      </div>
    </div>
  );
};

export default TournamentPage;