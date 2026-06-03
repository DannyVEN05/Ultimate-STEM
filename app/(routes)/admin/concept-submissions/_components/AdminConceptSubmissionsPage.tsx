"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import ReviewModal, {
  type Submission,
  type SubmissionStatus,
  statusConfig,
  detectBadWords,
} from "./ReviewModal";

async function fetchSubmissions(): Promise<Submission[]> {
  const { data: subs, error } = await supabase
    .from("tournament_submission")
    .select(`
      tournamentsub_id,
      tournamentsub_status,
      tournamentsub_likes,
      tournamentsub_created_at,
      tournament ( tournament_id, tournament_title ),
      concept (
        concept_id,
        concept_title,
        concept_description,
        concept_genre,
        concept_styling,
        user_id,
        user ( user_id, user_firstname, user_lastname )
      )
    `)
    .not("tournamentsub_status", "eq", "deleted")
    .order("tournamentsub_created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!subs || subs.length === 0) return [];
  // Collect any concept.user_id values where the nested `user` object wasn't returned
  const missingUserIds = [...new Set((subs as any[])
    .map((row: any) => (row.concept ?? {}).user_id)
    .filter(Boolean))];

  let usersMap = new Map<string, { user_firstname?: string; user_lastname?: string }>();
  if (missingUserIds.length > 0) {
    const { data: users } = await supabase
      .from("user")
      .select("user_id, user_firstname, user_lastname")
      .in("user_id", missingUserIds);
    if (users) {
      usersMap = new Map(users.map((u: any) => [u.user_id, { user_firstname: u.user_firstname, user_lastname: u.user_lastname }]));
    }
  }

  return (subs as any[]).map((row: any) => {
    const concept = row.concept ?? {};
    const tournament = row.tournament ?? {};
    // `concept.user` may be an object or an array depending on the relationship shape
    const rawUser = concept.user ?? {};
    const nestedUser = Array.isArray(rawUser) ? rawUser[0] ?? null : rawUser || null;

    let author = "Unknown";
    if (nestedUser && (nestedUser.user_firstname || nestedUser.user_lastname)) {
      author = `${nestedUser.user_firstname ?? ""} ${nestedUser.user_lastname ?? ""}`.trim();
    } else if (concept.user_id && usersMap.has(concept.user_id)) {
      const u = usersMap.get(concept.user_id)!;
      author = `${u.user_firstname ?? ""} ${u.user_lastname ?? ""}`.trim();
    }

    return {
      submissionId: row.tournamentsub_id,
      conceptId: concept.concept_id ?? row.concept_id,
      author,
      tournament: tournament.tournament_title ?? "Unknown Tournament",
      title: concept.concept_title ?? "Untitled",
      category: concept.concept_genre ?? "—",
      description: concept.concept_description ?? "",
      submittedAt: row.tournamentsub_created_at?.slice(0, 10) ?? "",
      status: (row.tournamentsub_status === "active" || row.tournamentsub_status == null ? "pending" : row.tournamentsub_status) as SubmissionStatus,
      likes: row.tournamentsub_likes ?? 0,
      styling: concept.concept_styling ?? null,
    } as Submission;
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminConceptSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | "all" | "flagged">("all");
  const [reviewing, setReviewing] = useState<Submission | null>(null);

  useEffect(() => {
    setError(null);
    fetchSubmissions()
      .then(setSubmissions)
      .catch((err: Error) => setError(err.message));
  }, []);

  const handleAction = async (submissionId: string, status: "approved" | "rejected") => {
    const submission = submissions.find((s) => s.submissionId === submissionId);

    const { error: subError } = await supabase
      .from("tournament_submission")
      .update({ tournamentsub_status: status, tournamentsub_updated_at: new Date().toISOString() })
      .eq("tournamentsub_id", submissionId);
    if (subError) { setError(subError.message); return; }

    if (submission) {
      const conceptUpdate = status === "approved"
        ? { concept_reviewed_at: new Date().toISOString(), concept_status: "active" }
        : { concept_status: "inactive" };

      const { error: conceptError } = await supabase
        .from("concept")
        .update(conceptUpdate)
        .eq("concept_id", submission.conceptId);

      if (conceptError) {
        // Roll back the submission status update to keep both records consistent
        await supabase
          .from("tournament_submission")
          .update({ tournamentsub_status: submission.status, tournamentsub_updated_at: new Date().toISOString() })
          .eq("tournamentsub_id", submissionId);
        setError(`Concept update failed (submission rolled back): ${conceptError.message}`);
        return;
      }
    }

    setSubmissions((prev) =>
      prev.map((s) => (s.submissionId === submissionId ? { ...s, status } : s))
    );
  };

  const filtered = submissions.filter((s) => {
    const flags = detectBadWords(s.title + " " + s.description);
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.author.toLowerCase().includes(search.toLowerCase()) ||
      s.tournament.toLowerCase().includes(search.toLowerCase());
    if (filterStatus === "flagged") return matchSearch && flags.length > 0;
    if (filterStatus === "all") return matchSearch;
    return matchSearch && s.status === filterStatus;
  });

  const flaggedCount = submissions.filter((s) => detectBadWords(s.title + " " + s.description).length > 0).length;
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;

  return (
    <div className="min-h-full px-4 py-6 text-[#182033] md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Concept Submissions
          </h1>
          <p className="mt-3 text-base leading-7 text-[#8088a0]">
            Review, approve, or reject submitted concepts. Flagged content is automatically highlighted.
          </p>
          {error && <p className="mt-1 text-sm text-[#c0314e]">Failed to load: {error}</p>}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { key: "pending" as const, label: "Pending Review", count: pendingCount, numColor: "text-[#1d2436]", iconBg: "bg-[#fff7e6] text-[#b97805]", icon: <AlertTriangle className="h-5 w-5" /> },
              { key: "approved" as const, label: "Approved", count: approvedCount, numColor: "text-[#1a8a55]", iconBg: "bg-[#e6f9f0] text-[#1a8a55]", icon: <CheckCircle2 className="h-5 w-5" /> },
              { key: "rejected" as const, label: "Rejected", count: rejectedCount, numColor: "text-[#c0314e]", iconBg: "bg-[#fde8ec] text-[#c0314e]", icon: <XCircle className="h-5 w-5" /> },
              { key: "flagged" as const, label: "Flagged Content", count: flaggedCount, numColor: "text-[#1d2436]", iconBg: "bg-[#ede9fe] text-[#6d3ef0]", icon: <AlertTriangle className="h-5 w-5" /> },
            ] as const
          ).map(({ key, label, count, numColor, iconBg, icon }) => (
            <Card
              key={key}
              className={`cursor-pointer rounded-2xl border-[#ececf6] transition hover:shadow-md ${filterStatus === key ? "ring-2 ring-[#8b5cf6]" : ""}`}
              onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9aa0b8]">{label}</p>
                  <p className={`mt-1 text-3xl font-black tracking-[-0.04em] ${numColor}`}>{count}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
                  {icon}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#9aa3b8]" />
            <Input
              className="h-11 rounded-full border-[#e5e7f2] bg-white pl-10 pr-5 text-sm placeholder:text-[#b2b8ca]"
              placeholder="Search by title, author, or tournament…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="h-11 appearance-none rounded-full border border-[#e5e7f2] bg-white px-5 pr-10 text-sm text-[#2a3148] outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">⚠ Flagged</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#9aa3b8]" />
          </div>
        </div>

        {/* Submission cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-[#9aa0b8]">No submissions match your filters.</p>
          ) : (
            filtered.map((s) => {
              const flags = detectBadWords(s.title + " " + s.description);
              const cfg = statusConfig[s.status];
              return (
                <Card
                  key={s.submissionId}
                  className={`rounded-2xl border-[#ececf6] gap-0 py-0 transition ${flags.length > 0 ? "border-[#f5b8c4] bg-[#fffbfb]" : ""}`}
                >
                  <CardHeader className="p-5 pb-0">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {flags.length > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-[#fde8ec] px-2.5 py-0.5 text-xs font-bold text-[#c0314e]">
                            <AlertTriangle className="h-3 w-3" />
                            Flagged: {flags.join(", ")}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${cfg?.className}`}>
                          {cfg?.icon}{cfg?.label}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-black tracking-[-0.02em] text-[#1d2436]">
                        {s.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-[#8a92a8]">
                        By <span className="font-semibold text-[#48506b]">{s.author}</span> · {s.tournament} · {s.category} · {s.submittedAt}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-[#e5e7f2] text-[#6b7490] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
                        onClick={() => setReviewing(s)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-[#f5b8c4] text-[#c0314e] hover:bg-[#fde8ec]"
                        onClick={() => handleAction(s.submissionId, "rejected")}
                        disabled={s.status === "rejected"}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full bg-[#1a8a55] text-white hover:bg-[#156e44]"
                        onClick={() => handleAction(s.submissionId, "approved")}
                        disabled={s.status === "approved"}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {reviewing && (
        <ReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default AdminConceptSubmissionsPage;
