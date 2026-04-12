"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";


export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Submission {
  submissionId: string;
  conceptId: string;
  author: string;
  tournament: string;
  title: string;
  category: string;
  description: string;
  submittedAt: string;
  status: SubmissionStatus;
  likes: number;
}

import { profanity } from "@2toad/profanity";

export function detectBadWords(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
  const unique = [...new Set(words)];
  return unique.filter((w) => profanity.exists(w));
}

export function highlightBadWords(text: string, flags: string[]): React.ReactNode {
  if (flags.length === 0) return text;
  const escaped = flags.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    flags.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-[#fde8ec] text-[#c0314e] rounded px-0.5 font-semibold not-italic">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export const statusConfig: Record<SubmissionStatus, { label: string; className: string; icon: React.ReactNode }> = {
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

interface ReviewModalProps {
  submission: Submission | null;
  onClose: () => void;
  onAction: (submissionId: string, status: "approved" | "rejected") => Promise<void>;
}

export default function ReviewModal({ submission, onClose, onAction }: ReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!submission) return null;

  const flags = detectBadWords(submission.title + " " + submission.description);
  const cfg = statusConfig[submission.status];

  const handleAction = async (status: "approved" | "rejected") => {
    setLoading(true);
    setActionError(null);
    try {
      await onAction(submission.submissionId, status);
      onClose();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-xl">
        <DialogTitle className="sr-only">{submission.title}</DialogTitle>

        {/* BookCard-style two-column layout */}
        <div className="relative flex gap-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all">

          {/* Left — cover placeholder (mirrors BookCard's left flex-1) */}
          <div className="w-[150px] shrink-0 bg-white shadow-md border border-gray-200 rounded-xl flex flex-col items-center justify-between p-4 hover:shadow-xl transition-shadow transform hover:-translate-y-0.5">
            <div className="flex-1 flex items-center justify-center w-full">
              <BookOpen className="h-14 w-14 text-gray-200" />
            </div>
            <div className="text-center mt-3 w-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9aa0b8] truncate">{submission.category}</p>
            </div>
          </div>

          {/* Right — content (mirrors BookCard's right flex-1 flex-col gap-2) */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pr-8">
              {flags.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[#fde8ec] px-2.5 py-0.5 text-xs font-bold text-[#c0314e]">
                  <AlertTriangle className="h-3 w-3" />
                  Flagged
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${cfg?.className}`}>
                {cfg?.icon}{cfg?.label}
              </span>
              <span className="ml-auto text-xs text-[#9aa0b8]">{submission.submittedAt}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-[#1d2436] leading-tight">{submission.title}</h3>

            {/* Author / tournament */}
            <p className="text-sm text-[#8088a0]">
              By <span className="font-semibold text-[#48506b]">{submission.author}</span>
              {" · "}{submission.tournament}
            </p>

            {/* Description */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9aa0b8] mb-1">Description</p>
              <div className="max-h-32 overflow-y-auto pr-1">
                <p className="text-sm leading-7 text-[#5a637a]">
                  {highlightBadWords(submission.description, flags)}
                </p>
              </div>
            </div>

            {/* Flagged words */}
            {flags.length > 0 && (
              <div className="rounded-xl bg-[#fffbfb] border border-[#f5b8c4] px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#c0314e] mb-1.5">Flagged Words</p>
                <div className="flex flex-wrap gap-1.5">
                  {flags.map((w) => (
                    <span key={w} className="rounded-full bg-[#fde8ec] px-2.5 py-0.5 text-xs font-bold text-[#c0314e]">{w}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Likes */}
            <div className="flex items-center gap-1.5 text-sm text-[#8088a0]">
              <Heart className="h-3.5 w-3.5" />
              <span className="font-semibold text-[#1d2436]">{submission.likes}</span>
              <span>likes</span>
            </div>

            {/* Error */}
            {actionError && (
              <p className="text-xs text-[#c0314e] font-medium">{actionError}</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-auto pt-1">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-[#f5b8c4] text-[#c0314e] hover:bg-[#fde8ec]"
                onClick={() => handleAction("rejected")}
                disabled={loading || submission.status === "rejected"}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                className="flex-1 rounded-full bg-[#1a8a55] text-white hover:bg-[#156e44]"
                onClick={() => handleAction("approved")}
                disabled={loading || submission.status === "approved"}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
