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
        const { data: { user: authUser } } = await supabase.auth.getUser();

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

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        dispatch({ type: AuthActionKind.SET_USER, payload: null });
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logIn = async (logInData: LogInData) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(logInData);
      if (signInError) return signInError.message;

      const { data: user, error: profileError } = await supabase
        .from('user')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) return "Could not fetch user profile.";

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
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthState;