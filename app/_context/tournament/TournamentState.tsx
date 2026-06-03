"use client";

import React, { useReducer, useCallback } from "react";
import tournamentReducer, { TournamentReducerState } from "./TournamentReducer";
import { Tournament, TournamentStatus } from "@/app/_types/model/Tournament";
import { supabase } from "@/lib/supabase";
import { TournamentActionKind } from "@/app/_types/context";
import TournamentContext from "./TournamentContext";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
};

const TournamentState = ({ children }: Props) => {
  const initialState: TournamentReducerState = {
    tournaments: [],
    tournament: null,
    status: "",
  };

  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  const mapToTournament = (row: any): Tournament => {
    return new Tournament(
      row.tournament_id,
      row.tournament_title,
      row.tournament_genre,
      row.tournament_start_date,
      row.tournament_s2_start_date ?? null,
      row.tournament_end_date,
      row.tournament_participants,
      row.tournament_user_limit,
      row.tournament_status as TournamentStatus
    );
  };

  const setTournaments = useCallback(async () => {
    let mounted = true;
    dispatch({ type: TournamentActionKind.SET_STATUS, payload: "loading" });
    try {
      const { data, error } = await supabase
        .from("tournament")
        .select(
          "tournament_id, tournament_title, tournament_genre, tournament_start_date, tournament_s2_start_date, tournament_end_date, tournament_participants, tournament_user_limit, tournament_status"
        )
        .order("tournament_start_date", { ascending: false });

      if (error) throw error;

      if (mounted) {
        dispatch({ type: TournamentActionKind.SET_TOURNAMENTS, payload: (data ?? []).map(mapToTournament) });
        dispatch({ type: TournamentActionKind.SET_STATUS, payload: "success" });
      }
    } catch (err) {
      console.warn("Error fetching tournaments:", err);
      if (mounted) {
        dispatch({ type: TournamentActionKind.SET_TOURNAMENTS, payload: [] });
        dispatch({ type: TournamentActionKind.SET_STATUS, payload: "error" });
      }
    }
  }, []);

  const setTournament = useCallback(async (id: number) => {
    let mounted = true;
    dispatch({ type: TournamentActionKind.SET_STATUS, payload: "loading" });
    try {
      const { data, error } = await supabase
        .from("tournament")
        .select(
          "tournament_id, tournament_title, tournament_genre, tournament_start_date, tournament_s2_start_date, tournament_end_date, tournament_participants, tournament_user_limit, tournament_status"
        )
        .eq("tournament_id", id)
        .single();

      if (error) throw error;

      if (mounted) {
        dispatch({ type: TournamentActionKind.SET_TOURNAMENT, payload: mapToTournament(data) });
        dispatch({ type: TournamentActionKind.SET_STATUS, payload: "success" });
      }
    } catch (err) {
      console.warn("Error fetching tournament:", err);
      if (mounted) {
        dispatch({ type: TournamentActionKind.SET_TOURNAMENT, payload: null });
        dispatch({ type: TournamentActionKind.SET_STATUS, payload: "error" });
      }
    }
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournaments: state.tournaments,
        tournament: state.tournament,
        status: state.status,
        setTournaments,
        setTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export default TournamentState;
