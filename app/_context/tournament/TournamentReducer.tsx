import { TournamentActionKind } from "@/app/_types/context";
import { Tournament } from "@/app/_types/model/Tournament";
import { Reducer } from "react";

export interface TournamentReducerState {
  tournaments: Tournament[];
  tournament: Tournament | null;
  status: string;
}

export type TournamentReducerAction =
  | { type: TournamentActionKind.SET_TOURNAMENTS; payload: Tournament[] }
  | { type: TournamentActionKind.SET_TOURNAMENT; payload: Tournament | null }
  | { type: TournamentActionKind.SET_STATUS; payload: string };

const tournamentReducer: Reducer<TournamentReducerState, TournamentReducerAction> = (state, action): TournamentReducerState => {
  switch (action.type) {
    case TournamentActionKind.SET_TOURNAMENTS:
      return {
        ...state,
        tournaments: action.payload ?? [],
      };

    case TournamentActionKind.SET_TOURNAMENT:
      return {
        ...state,
        tournament: action.payload,
      };

    case TournamentActionKind.SET_STATUS:
      return {
        ...state,
        status: action.payload,
      };

    default:
      return state;
  }
};

export default tournamentReducer;
