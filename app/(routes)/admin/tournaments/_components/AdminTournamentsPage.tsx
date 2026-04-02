"use client";

import { useEffect, useState } from "react";
import { Trophy, Clock, CheckCircle2, XCircle, Search, ChevronDown, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import CreateTournamentModal from "./CreateTournamentModal";

type TournamentStatus = "active" | "completed" | "upcoming" | "cancelled";

interface Tournament {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  participants: number;
  participantLimit: number;
  status: TournamentStatus;
  winner?: string;
  winnerSubmission?: string;
}

async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from("tournament")
    .select("tournament_id, tournament_title, tournament_genre, tournament_start_date, tournament_end_date, tournament_participants, tournament_user_limit, tournament_status")
    .order("tournament_start_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.tournament_id,
    title: row.tournament_title,
    category: row.tournament_genre,
    startDate: row.tournament_start_date,
    endDate: row.tournament_end_date,
    participants: row.tournament_participants,
    participantLimit: row.tournament_user_limit,
    status: row.tournament_status as TournamentStatus,
    // winner: row.tournament_winner ?? undefined,
    // winnerSubmission: row.tournament_winner_submission ?? undefined,
  }));
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const statusConfig: Record<TournamentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  active: {
    label: "Active",
    className: "bg-[#e6f9f0] text-[#1a8a55]",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    className: "bg-[#ede9fe] text-[#6d3ef0]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-[#fff7e6] text-[#b97805]",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#fde8ec] text-[#c0314e]",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

interface QueueItem {
  id: string;
  submissionId: string;
  title: string;
  category: string;
  status: string;
  likes: number;
}

async function getQueueItems(): Promise<QueueItem[]> {
  const { data: subs, error: subsError } = await supabase
    .from("tournament_submission")
    .select("tournamentsub_id, tournamentsub_status, tournamentsub_likes, concept_id")
    .eq("tournamentsub_status", "pending")
    .order("tournamentsub_created_at", { ascending: false });

  if (subsError) throw new Error(subsError.message);
  if (!subs || subs.length === 0) return [];

  const conceptIds = subs.map((s: any) => s.concept_id);

  const { data: concepts, error: conceptsError } = await supabase
    .from("concepts")
    .select("concept_id, concept_title, concept_genre")
    .in("concept_id", conceptIds);

  if (conceptsError) throw new Error(conceptsError.message);

  const conceptMap = new Map((concepts ?? []).map((c: any) => [c.concept_id, c]));

  return subs.map((row: any) => {
    const concept = conceptMap.get(row.concept_id);
    return {
      id: row.concept_id,
      submissionId: row.tournamentsub_id,
      title: concept?.concept_title ?? "Untitled",
      category: concept?.concept_genre ?? "—",
      status: row.tournamentsub_status,
      likes: row.tournamentsub_likes ?? 0,
    };
  });
}

const AdminTournamentsPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TournamentStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const openCreate = () => { setEditingTournament(null); setModalOpen(true); };
  const openEdit = (t: Tournament) => { setEditingTournament(t); setModalOpen(true); };

  useEffect(() => {
    setLoading(true);
    Promise.all([getTournaments(), getQueueItems()])
      .then(([t, q]) => { setTournaments(t); setQueue(q); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [modalOpen]);

  const handleQueueAction = async (item: QueueItem, action: "approved" | "rejected") => {
    await supabase
      .from("tournament_submission")
      .update({ tournamentsub_status: action, tournamentsub_updated_at: new Date().toISOString() })
      .eq("tournamentsub_id", item.submissionId);
    setQueue((prev) => prev.filter((q) => q.submissionId !== item.submissionId));
  };

  const filtered = tournaments.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-full flex flex-col gap-4 px-4 py-4 text-[#182033] md:px-8 md:py-6">
      <div className="mx-auto w-full max-w-[1400px] flex flex-col gap-4 h-full min-h-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.05em]">Tournaments</h1>
            <p className="text-sm text-[#8088a0]">
              View all tournaments, and their current status.
            </p>
            {error && (
              <p className="mt-1 text-sm text-[#c0314e]">Failed to load: {error}</p>
            )}
          </div>
          <Button
            className="shrink-0 rounded-sm bg-[linear-gradient(135deg,#8b5cf6_0%,#6d3ef0_100%)] px-6 text-white"
            onClick={() => openCreate()}
          >
            <Plus className="h-4 w-4" />
            Create Tournament
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
          {(["all", "active", "completed", "upcoming"] as const).map((s) => {
            const count = s === "all" ? tournaments.length : tournaments.filter((t) => t.status === s).length;
            const cfg = s === "all" ? null : statusConfig[s];
            return (
              <Card
                key={s}
                className={`cursor-pointer rounded-2xl border-[#ececf6] transition hover:shadow-md ${filterStatus === s ? "ring-2 ring-[#8b5cf6]" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9aa0b8]">
                      {s === "all" ? "Total" : cfg!.label}
                    </p>
                    <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#1d2436]">{count}</p>
                  </div>
                  {s !== "all" && (
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${cfg!.className}`}>
                      {cfg!.icon}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 7:3 layout */}
        <div className="flex flex-col gap-4 flex-1 min-h-0 xl:grid xl:grid-cols-[7fr_3fr]">
          {/* Left — table */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#9aa3b8]" />
                <Input
                  className="h-11 rounded-full border-[#e5e7f2] bg-white pl-10 pr-5 text-sm placeholder:text-[#b2b8ca]"
                  placeholder="Search by title or category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  className="h-11 appearance-none rounded-full border border-[#e5e7f2] bg-white px-5 pr-10 text-sm text-[#2a3148] outline-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TournamentStatus | "all")}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#9aa3b8]" />
              </div>
            </div>

            <Card className="rounded-2xl border-[#ececf6] overflow-hidden py-0 gap-0 flex flex-col flex-1 min-h-0">
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-[#f0f1f7] bg-[#fafbff]">
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-[#9aa0b8]">Tournament</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-[#9aa0b8]">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-[#9aa0b8]">Dates</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-[#9aa0b8]">Participants</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-[#9aa0b8]">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#9aa0b8]">
                          No tournaments match your search.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((t, i) => {
                        const cfg = statusConfig[t.status];
                        return (
                          <tr
                            key={t.id}
                            className={`border-b border-[#f0f1f7] transition hover:bg-[#fafbff] ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                          >
                            <td className="px-6 py-4 font-semibold text-[#1d2436]">{t.title}</td>
                            <td className="px-6 py-4 text-[#6b7490]">{t.category}</td>
                            <td className="px-6 py-4 text-[#6b7490]">{formatDate(t.startDate)} → {formatDate(t.endDate)}</td>
                            <td className="px-6 py-4 text-[#6b7490]">{t.participants} / {t.participantLimit}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.className}`}>
                                {cfg.icon}{cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full border-[#e5e7f2] text-[#6b7490] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
                                onClick={() => openEdit(t)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right — pre-screen queue */}
          <div className="min-h-0 flex flex-col">
            <Card className="rounded-2xl border-[#ececf6] shadow-[0_4px_20px_rgba(28,36,72,0.04)] gap-0 py-0 flex flex-col flex-1 min-h-0">
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl font-black tracking-[-0.03em] text-[#1d2436]">
                      <Link href="/admin/concept-submissions">Pre-screen Queue</Link>
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-[#8a92a8]">
                      {queue.length} pending for review
                    </CardDescription>
                  </div>
                  {queue.length > 0 && (
                    <span className="rounded-full bg-[#ffe7b8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#b97805]">
                      Urgent
                    </span>
                  )}
                </div>
              </CardHeader>

              <div className="divide-y divide-[#f0f1f7] overflow-y-auto flex-1">
                {queue.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-[#b0b8cc]">All caught up!</p>
                ) : (
                  queue.map((item) => (
                    <div key={item.id} className="px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b1b8ca]">{item.category}</p>
                      <p className="mt-1 text-sm font-bold leading-snug text-[#1f2639]">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-[#8b92a7]">{item.likes} likes</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 rounded-full bg-[#1a8a55] text-white hover:bg-[#156e44]"
                          onClick={() => handleQueueAction(item, "approved")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full border-[#f5b8c4] text-[#c0314e] hover:bg-[#fde8ec]"
                          onClick={() => handleQueueAction(item, "rejected")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <CardFooter className="px-5 py-4 border-t border-[#f0f1f7]">
                <Button variant="secondary" className="w-full rounded-sm" asChild>
                  <Link href="/admin/concept-submissions">View All Submissions</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <CreateTournamentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tournament={editingTournament ? {
          id: editingTournament.id,
          title: editingTournament.title,
          category: editingTournament.category,
          startDate: editingTournament.startDate,
          endDate: editingTournament.endDate,
          participantLimit: editingTournament.participantLimit,
        } : undefined}
      />
    </div>
  );
};

export default AdminTournamentsPage;
