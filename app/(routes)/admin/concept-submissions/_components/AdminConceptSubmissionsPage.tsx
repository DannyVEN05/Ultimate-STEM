"use client";

import { useState } from "react";
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
  CardAction,
} from "@/components/ui/card";

// Simple bad-word list — extend as needed
const BAD_WORDS = ["badword1", "badword2", "offensive", "inappropriate", "hate", "stupid", "dumb", "idiot"];

function detectBadWords(text: string): string[] {
  const lower = text.toLowerCase();
  return BAD_WORDS.filter((w) => lower.includes(w));
}

type SubmissionStatus = "pending" | "approved" | "rejected";

interface Submission {
  id: string;
  author: string;
  tournament: string;
  title: string;
  category: string;
  description: string;
  submittedAt: string;
  status: SubmissionStatus;
}

const initialSubmissions: Submission[] = [
  {
    id: "1",
    author: "Jordan Lee",
    tournament: "Origami Geometry Sprint",
    title: "Neon Reactions: Safe at Home",
    category: "Chemistry",
    description: "A tactile approach to learning chemical changes and safety through simple experiments.",
    submittedAt: "2026-04-11",
    status: "pending",
  },
  {
    id: "2",
    author: "Mia Torres",
    tournament: "Origami Geometry Sprint",
    title: "The Kinetic Engine: A Visual Guide",
    category: "Physics",
    description: "Visualizing movement through friction, force, and balance using everyday objects.",
    submittedAt: "2026-04-11",
    status: "approved",
  },
  {
    id: "3",
    author: "Alex Kim",
    tournament: "Origami Geometry Sprint",
    title: "Proving Theorems Through Folds",
    category: "Mathematics",
    description: "Proving geometry theorems through the art of folds, symmetry, and proof.",
    submittedAt: "2026-04-12",
    status: "pending",
  },
  {
    id: "4",
    author: "Sam Reyes",
    tournament: "Origami Geometry Sprint",
    title: "This is a stupid and inappropriate idea",
    category: "Biology",
    description: "Some offensive content that includes hate speech and dumb arguments.",
    submittedAt: "2026-04-12",
    status: "pending",
  },
  {
    id: "5",
    author: "Taylor Brown",
    tournament: "Kinetic Forces Challenge",
    title: "Applied Forces in Everyday Life",
    category: "Physics",
    description: "Exploring how Newton's laws manifest in sports, vehicles, and household items.",
    submittedAt: "2026-03-11",
    status: "rejected",
  },
];

const statusConfig: Record<SubmissionStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "bg-[#fff7e6] text-[#b97805]",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  approved: {
    label: "Approved",
    className: "bg-[#e6f9f0] text-[#1a8a55]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Rejected",
    className: "bg-[#fde8ec] text-[#c0314e]",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const AdminConceptSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | "all" | "flagged">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const setStatus = (id: string, status: SubmissionStatus) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
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
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-[#ececf6]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9aa0b8]">Pending Review</p>
                <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#1d2436]">{pendingCount}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7e6] text-[#b97805]">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#ececf6]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9aa0b8]">Flagged Content</p>
                <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#c0314e]">{flaggedCount}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fde8ec] text-[#c0314e]">
                <XCircle className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#ececf6]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9aa0b8]">Total Submissions</p>
                <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#1d2436]">{submissions.length}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede9fe] text-[#6d3ef0]">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
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
              const isExpanded = expandedId === s.id;

              return (
                <Card
                  key={s.id}
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
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${cfg.className}`}>
                          {cfg.icon}
                          {cfg.label}
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
                    {isExpanded && (
                      <p className="mb-4 text-sm leading-6 text-[#5a637a]">{s.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#8b5cf6] hover:opacity-75"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isExpanded ? "Hide description" : "View description"}
                      </button>
                      <div className="ml-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-[#f5b8c4] text-[#c0314e] hover:bg-[#fde8ec]"
                          onClick={() => setStatus(s.id, "rejected")}
                          disabled={s.status === "rejected"}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full bg-[#1a8a55] text-white hover:bg-[#156e44]"
                          onClick={() => setStatus(s.id, "approved")}
                          disabled={s.status === "approved"}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminConceptSubmissionsPage;
