"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const profaneWords: string[] = require("profane-words");

export function detectBadWords(text: string): string[] {
  const lower = text.toLowerCase();
  return profaneWords.filter((w) => lower.includes(w));
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

  if (!submission) return null;

  const flags = detectBadWords(submission.title + " " + submission.description);
  const cfg = statusConfig[submission.status];

  const handleAction = async (status: "approved" | "rejected") => {
    setLoading(true);
    await onAction(submission.submissionId, status);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
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
          <DialogTitle>{submission.title}</DialogTitle>
          <DialogDescription>
            By <span className="font-semibold text-[#48506b]">{submission.author}</span>
            {" · "}{submission.tournament}{" · "}{submission.category}{" · "}{submission.submittedAt}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2 space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9aa0b8] mb-2">Description</p>
            <p className="text-sm leading-7 text-[#5a637a]">
              {highlightBadWords(submission.description, flags)}
            </p>
          </div>

          {flags.length > 0 && (
            <div className="rounded-xl bg-[#fffbfb] border border-[#f5b8c4] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#c0314e] mb-2">Flagged Words Detected</p>
              <div className="flex flex-wrap gap-2">
                {flags.map((w) => (
                  <span key={w} className="rounded-full bg-[#fde8ec] px-2.5 py-0.5 text-xs font-bold text-[#c0314e]">{w}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#9aa0b8]">Likes</p>
              <p className="mt-0.5 font-semibold text-[#1d2436]">{submission.likes}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#9aa0b8]">Category</p>
              <p className="mt-0.5 font-semibold text-[#1d2436]">{submission.category}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full border-[#f5b8c4] text-[#c0314e] hover:bg-[#fde8ec]"
            onClick={() => handleAction("rejected")}
            disabled={loading || submission.status === "rejected"}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            className="rounded-full bg-[#1a8a55] text-white hover:bg-[#156e44]"
            onClick={() => handleAction("approved")}
            disabled={loading || submission.status === "approved"}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
