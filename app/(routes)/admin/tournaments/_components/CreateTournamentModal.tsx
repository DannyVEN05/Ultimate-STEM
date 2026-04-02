"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface TournamentToEdit {
  id: string | number;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  participantLimit: number;
  status?: string;
}

interface CreateTournamentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament?: TournamentToEdit;
}

const emptyForm = { title: "", category: "", startDate: "", endDate: "", participantLimit: "" };

const CreateTournamentModal = ({ open, onOpenChange, tournament }: CreateTournamentModalProps) => {
  const isEdit = !!tournament;

  const [formData, setFormData] = useState(emptyForm);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Sync form when tournament prop changes (opening in edit mode)
  useEffect(() => {
    if (tournament) {
      setFormData({
        title: tournament.title,
        category: tournament.category,
        startDate: tournament.startDate.slice(0, 10),
        endDate: tournament.endDate.slice(0, 10),
        participantLimit: String(tournament.participantLimit),
      });
    } else {
      setFormData(emptyForm);
    }
    setSubmitState("idle");
    setSubmitError(null);
  }, [tournament, open]);

  const handleChange = (field: keyof typeof formData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitState("submitting");
    setSubmitError(null);

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      setSubmitError("End date must be on or after the start date.");
      setSubmitState("error");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(formData.startDate);
    const newStatus = start > today ? "upcoming" : "active";

    if (isEdit && tournament) {
      const { error } = await supabase
        .from("tournament")
        .update({
          tournament_title: formData.title,
          tournament_genre: formData.category,
          tournament_start_date: formData.startDate,
          tournament_end_date: formData.endDate,
          tournament_user_limit: Number(formData.participantLimit),
          tournament_status: ["completed", "cancelled"].includes(tournament.status as string)
            ? tournament.status
            : newStatus,
          tournament_updated_at: new Date().toISOString(),
        })
        .eq("tournament_id", tournament.id);

      if (error) {
        setSubmitError(error.message);
        setSubmitState("error");
        return;
      }
    } else {
      const { error } = await supabase.from("tournament").insert({
        tournament_title: formData.title,
        tournament_genre: formData.category,
        tournament_start_date: formData.startDate,
        tournament_end_date: formData.endDate,
        tournament_user_limit: Number(formData.participantLimit),
        tournament_participants: 0,
        tournament_status: newStatus,
      });

      if (error) {
        setSubmitError(error.message);
        setSubmitState("error");
        return;
      }
    };
    setSubmitState("success");
    setTimeout(() => {
      onOpenChange(false);
      setFormData(emptyForm);
      setSubmitState("idle");
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tournament" : "Create New Tournament"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update the details for this tournament." : "Configure the parameters for the next tournament challenge."}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#48506b]">Tournament Title</span>
              <Input
                className="border-[#e5e7f2] bg-white text-[15px] text-[#2a3148] placeholder:text-[#b2b8ca]"
                value={formData.title}
                placeholder="e.g. The Molecular Playground 2026"
                required
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#48506b]">Category</span>
                <Input
                  className="border-[#e5e7f2] bg-white text-[15px] text-[#2a3148] placeholder:text-[#b2b8ca]"
                  value={formData.category}
                  placeholder="e.g. Physics, Biology…"
                  onChange={(e) => handleChange("category", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#48506b]">Participant Limit</span>
                <Input
                  className="border-[#e5e7f2] bg-white text-[15px] text-[#2a3148] placeholder:text-[#b2b8ca]"
                  type="number"
                  min={1}
                  value={formData.participantLimit}
                  placeholder="e.g. 128"
                  required
                  onChange={(e) => handleChange("participantLimit", e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#48506b]">Start Date</span>
                <div className="relative">
                  <input
                    ref={startDateRef}
                    className="h-9 w-full rounded-sm border border-[#e5e7f2] bg-white px-3 pr-10 text-[15px] text-[#2a3148] outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => (startDateRef.current as any)?.showPicker?.()}
                  >
                    <CalendarDays className="h-4 w-4 text-[#9aa3b8]" />
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#48506b]">End Date</span>
                <div className="relative">
                  <input
                    ref={endDateRef}
                    className="h-9 w-full rounded-sm border border-[#e5e7f2] bg-white px-3 pr-10 text-[15px] text-[#2a3148] outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => (endDateRef.current as any)?.showPicker?.()}
                  >
                    <CalendarDays className="h-4 w-4 text-[#9aa3b8]" />
                  </button>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="flex-col items-stretch gap-2">
            {submitError && (
              <p className="text-center text-xs text-[#c0314e]">{submitError}</p>
            )}
            <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-full px-6">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              className="rounded-full bg-[linear-gradient(135deg,#8b5cf6_0%,#6d3ef0_100%)] px-6 text-white"
              disabled={submitState === "submitting"}
            >
              {submitState === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
              {submitState === "success"
                ? (isEdit ? "Saved!" : "Created!")
                : submitState === "submitting"
                ? (isEdit ? "Saving…" : "Creating…")
                : (isEdit ? "Save Changes" : "Create Tournament")}
            </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTournamentModal;
