"use client";

import React, { useReducer, useEffect } from "react";
import authReducer, { AuthReducerState } from "./AuthReducer";
import AuthContext from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { AuthActionKind } from "@/app/_types/context";
import { User } from "@/app/_types/model/User";

export type LogInData = {
  email: string;
  password: string;
};

type Props = {
  children?: React.ReactNode | React.ReactNode[];
}

const AuthState = ({ children }: Props) => {
  const initialState: AuthReducerState = {
    user: null,
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let mounted = true;

    const mapToAppUser = (rawUser: any): User | null => {
      if (!rawUser) return null;
      const meta = rawUser.user_metadata ?? {};
      return new User(
        rawUser.id ?? meta.sub ?? "",
        meta.firstName ?? "",
        meta.lastName ?? "",
        rawUser.email ?? meta.email ?? "",
        meta.phoneNumber ?? "",
        meta.dateOfBirth ? new Date(meta.dateOfBirth) : new Date(),
        rawUser.created_at ? new Date(rawUser.created_at) : new Date()
      );
    };

    const hydrate = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const appUser = mapToAppUser(data.user);
      dispatch({ type: AuthActionKind.SET_USER, payload: appUser });
    };
    hydrate();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const appUser = mapToAppUser(session?.user ?? null);
      dispatch({ type: AuthActionKind.SET_USER, payload: appUser });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const logIn = async (logInData: LogInData) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(logInData);

      if (signInError) return signInError.message ?? String(signInError);

      const { created_at } = data.user;
      const {
        sub,
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
      } = data.user.user_metadata as any;

      const user = new User(
        sub ?? "",
        firstName ?? "",
        lastName ?? "",
        email ?? "",
        phoneNumber ?? "",
        dateOfBirth ? new Date(dateOfBirth) : new Date(),
        created_at ? new Date(created_at) : new Date()
      );

      dispatch({
        type: AuthActionKind.SET_USER,
        payload: user,
      });
      return null;

    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  };

  const logOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return error.message ?? String(error);

      dispatch({ type: AuthActionKind.SET_USER, payload: null });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthState;