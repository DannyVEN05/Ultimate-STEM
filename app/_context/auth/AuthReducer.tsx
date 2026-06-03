import { AuthActionKind } from "@/app/_types/context";
import type { User } from "@/app/_types/model/User";
import { Reducer } from "react";

export interface AuthReducerState {
  user: User | null;
  isLoading: boolean;
}

export type AuthReducerAction =
  | { type: AuthActionKind.SET_USER; payload: User | null }
  | { type: AuthActionKind.SET_LOADING; payload: boolean };

const authReducer: Reducer<AuthReducerState, AuthReducerAction> = (state, action): AuthReducerState => {
  switch (action.type) {
    case AuthActionKind.SET_USER:
      return {
        ...state,
        user: action.payload,
      };

    case AuthActionKind.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

export default authReducer;