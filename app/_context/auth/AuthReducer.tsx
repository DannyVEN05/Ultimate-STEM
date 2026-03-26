import { AuthActionKind } from "@/app/_types/context";
import type { User } from "@/app/_types/model/User";
import { Reducer } from "react";

export interface AuthReducerState {
  user: User | null;
}

export type AuthReducerAction =
  | { type: AuthActionKind.SET_USER; payload: User | null };

const authReducer: Reducer<AuthReducerState, AuthReducerAction> = (state, action): AuthReducerState => {
  switch (action.type) {
    case AuthActionKind.SET_USER:
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

export default authReducer;