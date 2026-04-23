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

export type SignUpData = {
  email: string;
  password: string;
  user_firstname: string;
  user_lastname: string;
  user_phone_number: string;
  user_dob: string;
};

type Props = {
  children?: React.ReactNode | React.ReactNode[];
}

const AuthState = ({ children }: Props) => {
  const initialState: AuthReducerState = {
    user: null,
    isLoading: true,
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  const mapToAppUser = (u: any): User => {
    return new User(
      u.user_id,
      u.user_firstname,
      u.user_lastname,
      u.user_email,
      u.user_phone_number,
      u.user_dob ? new Date(u.user_dob) : null,
      u.user_created_at ? new Date(u.user_created_at) : new Date(),
      u.user_role
    );
  };

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          const status = (authError as any)?.status;
          const isAuthFailure =
            status === 401 ||
            authError.message?.toLowerCase().includes("refresh token") ||
            authError.message?.toLowerCase().includes("invalid") ||
            authError.message?.toLowerCase().includes("expired");

          if (isAuthFailure) {
            // Stale/invalid session — clear it so the user is prompted to log in again
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) console.warn("Sign-out failed during hydration:", signOutError);
          } else {
            // Transient error (network/server) — log and keep the local session intact
            console.warn("Transient error during auth hydration:", authError);
          }
          return;
        }

        if (authUser && mounted) {
          const { data: user, error } = await supabase
            .from("user")
            .select("*")
            .eq("user_id", authUser.id)
            .single();

          if (error) console.log("Error fetching user profile during hydration:", error);

          if (user) dispatch({ type: AuthActionKind.SET_USER, payload: mapToAppUser(user) });
        }
      } finally {
        if (mounted) dispatch({ type: AuthActionKind.SET_LOADING, payload: false });
      }
    };
    hydrate();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        dispatch({ type: AuthActionKind.SET_USER, payload: null });
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        if (session?.user) {
          // Defer the DB call with setTimeout to avoid a deadlock with Supabase's
          // internal auth lock (initializePromise). Calling supabase methods directly
          // inside onAuthStateChange blocks the lock and prevents hydrate() from
          // completing, keeping isLoading stuck at true.
          const userId = session.user.id;
          setTimeout(async () => {
            const { data: user, error } = await supabase
              .from("user")
              .select("*")
              .eq("user_id", userId)
              .single();

            if (error) console.error("Error fetching user profile on auth state change:", error);

            if (user && mounted) dispatch({ type: AuthActionKind.SET_USER, payload: mapToAppUser(user) });
          }, 0);
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (signUpData: SignUpData) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email.trim(),
        password: signUpData.password,
        options: {
          data: {
            user_firstname: signUpData.user_firstname.trim(),
            user_lastname: signUpData.user_lastname.trim(),
            user_phone_number: signUpData.user_phone_number.trim(),
            user_dob: signUpData.user_dob.trim(),
          },
        },
      });

      if (signUpError) return signUpError.message;

      const { data: user, error: profileError } = await supabase
        .from("user")
        .select("*")
        .eq("user_id", data.user?.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        dispatch({ type: AuthActionKind.SET_USER, payload: null });
        return "Could not fetch user profile.";
      }
      dispatch({
        type: AuthActionKind.SET_USER,
        payload: mapToAppUser(user),
      });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  };

  const logIn = async (logInData: LogInData) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(logInData);
      if (signInError) return signInError.message;

      const { data: user, error: profileError } = await supabase
        .from('user')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        dispatch({ type: AuthActionKind.SET_USER, payload: null });
        return "Could not fetch user profile.";
      }

      dispatch({
        type: AuthActionKind.SET_USER,
        payload: mapToAppUser(user),
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
        isLoading: state.isLoading,
        signUp,
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthState;