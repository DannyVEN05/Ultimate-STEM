"use client";

import { createContext } from "react";
import { Tournament } from "@/app/_types/model/Tournament";

export type TournamentContextType = {
  tournaments: Tournament[];
  tournament: Tournament | null;
  status: string;

  // Fetches all tournaments from Supabase and populates the tournaments array.
  setTournaments: () => Promise<void>;

  // Fetches a single tournament by id and sets it as the active tournament.
  setTournament: (id: string) => Promise<void>;
};

const TournamentContext = createContext({} as TournamentContextType);

export default TournamentContext;
