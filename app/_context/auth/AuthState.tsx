"use client";

import React, { useReducer, useEffect } from "react";
import authReducer, { AuthReducerState } from "./AuthReducer";
import AuthContext from "./AuthContext";
import type { AuthFailure } from "./AuthContext";
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

export type ReactivateProfileData = Omit<SignUpData, "password">;

type Props = {
  children?: React.ReactNode | React.ReactNode[];
}

type DbUserRow = {
  user_id: string;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_phone_number: string;
  user_dob: string | null;
  user_created_at: string | null;
  user_role: string;
};

const AuthState = ({ children }: Props) => {
  const initialState: AuthReducerState = {
    user: null,
    isLoading: true,
  };

  const isReactivatingRef = React.useRef(false);

  const [state, dispatch] = useReducer(authReducer, initialState);

  const mapToAppUser = (u: DbUserRow): User => {
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
          const status = (authError as AuthError & { status?: number })?.status;
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

          if (user && user.user_role === "deleted") {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) console.warn("Sign-out failed for deleted account during hydration:", signOutError);
            return;
          }

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

            if (user && user.user_role === "deleted") {
              if (isReactivatingRef.current) return;
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) console.warn("Sign-out failed for deleted account on auth state change:", signOutError);
              if (mounted) dispatch({ type: AuthActionKind.SET_USER, payload: null });
              return;
            }

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
      const emailRedirectTo = `${window.location.origin}/confirm`;
      const { error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email.trim(),
        password: signUpData.password,
        options: {
          data: {
            user_firstname: signUpData.user_firstname.trim(),
            user_lastname: signUpData.user_lastname.trim(),
            user_phone_number: signUpData.user_phone_number.trim(),
            user_dob: signUpData.user_dob.trim(),
          },
          emailRedirectTo,
        },
      });

      if (signUpError) return signUpError.message;
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  };

  const reactivateUser = async (signUpData: ReactivateProfileData, oldPassword: string) => {
    const email = signUpData.email.trim().toLowerCase();
    if (!email) return "Email is required.";
    if (!oldPassword) return "Password is required.";

    isReactivatingRef.current = true;
    let signedIn = false;

    const abortSignIn = async (message: string): Promise<string> => {
      await supabase.auth.signOut();
      dispatch({ type: AuthActionKind.SET_USER, payload: null });
      return message;
    };

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (signInError) return signInError.message ?? String(signInError);
      signedIn = true;

      const authenticatedUserId = signInData.user?.id;
      if (!authenticatedUserId) return await abortSignIn("Unable to verify identity.");

      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("user")
        .select("*")
        .eq("user_id", authenticatedUserId)
        .single();

      if (existingProfileError) return await abortSignIn(existingProfileError.message ?? String(existingProfileError));

      if (existingProfile?.user_role !== "deleted") {
        return await abortSignIn("This account is not disabled.");
      }

      const profilePayload = {
        user_firstname: signUpData.user_firstname.trim(),
        user_lastname: signUpData.user_lastname.trim(),
        user_email: email,
        user_phone_number: signUpData.user_phone_number.trim(),
        user_dob: signUpData.user_dob.trim(),
        user_role: "user",
      };

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          user_firstname: profilePayload.user_firstname,
          user_lastname: profilePayload.user_lastname,
          user_phone_number: profilePayload.user_phone_number,
          user_dob: profilePayload.user_dob,
        },
      });

      if (authUpdateError) return await abortSignIn(authUpdateError.message ?? String(authUpdateError));

      const { data: updatedProfile, error: profileError } = await supabase
        .from("user")
        .update(profilePayload)
        .eq("user_id", authenticatedUserId)
        .select("*")
        .single();

      if (profileError) return await abortSignIn(profileError.message ?? String(profileError));

      dispatch({ type: AuthActionKind.SET_USER, payload: mapToAppUser(updatedProfile as DbUserRow) });
      return null;
    } catch (err) {
      if (signedIn) {
        await supabase.auth.signOut();
        dispatch({ type: AuthActionKind.SET_USER, payload: null });
      }
      return err instanceof Error ? err.message : String(err);
    } finally {
      isReactivatingRef.current = false;
    }
  };

  const logIn = async (logInData: LogInData): Promise<null | AuthFailure> => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(logInData);
      if (signInError) {
        const code = "code" in signInError && typeof signInError.code === "string"
          ? signInError.code
          : undefined;
        const status = "status" in signInError && typeof signInError.status === "number"
          ? signInError.status
          : undefined;
        return {
          message: signInError.message,
          code,
          status,
        };
      }

      const { data: user, error: profileError } = await supabase
        .from('user')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        dispatch({ type: AuthActionKind.SET_USER, payload: null });
        return { message: "Could not fetch user profile." };
      }

      if (user.user_role === "deleted") {
        await supabase.auth.signOut();
        dispatch({ type: AuthActionKind.SET_USER, payload: null });
        return { message: "Invalid login credentials." };
      }

      dispatch({
        type: AuthActionKind.SET_USER,
        payload: mapToAppUser(user),
      });
      return null;
    } catch (err) {
      return { message: err instanceof Error ? err.message : String(err) };
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

  const updateUser = async (newUserData: User) => {
    try {
      const authenticatedUserId = state.user?.user_id;

      if (!authenticatedUserId) {
        return "Unable to update profile: no authenticated user.";
      }

      if (newUserData.user_id && newUserData.user_id !== authenticatedUserId) {
        return "Unable to update profile: user mismatch.";
      }

      const profilePayload = {
        user_firstname: newUserData.user_firstname.trim(),
        user_lastname: newUserData.user_lastname.trim(),
        user_email: newUserData.user_email.trim(),
        user_phone_number: newUserData.user_phone_number.trim(),
        user_dob: newUserData.user_dob ? newUserData.user_dob.toISOString().slice(0, 10) : null,
      };

      const { error: authError } = await supabase.auth.updateUser({
        email: profilePayload.user_email,
        data: {
          user_firstname: profilePayload.user_firstname,
          user_lastname: profilePayload.user_lastname,
          user_phone_number: profilePayload.user_phone_number,
          user_dob: profilePayload.user_dob,
        },
      });

      if (authError) return authError.message ?? String(authError);

      const { data: updatedProfile, error: profileError } = await supabase
        .from("user")
        .update(profilePayload)
        .eq("user_id", authenticatedUserId)
        .select("*")
        .single();

      if (profileError) return profileError.message ?? String(profileError);

      dispatch({ type: AuthActionKind.SET_USER, payload: mapToAppUser(updatedProfile) });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);

    }
  };

  const disableUser = async () => {
    try {
      if (!state.user) return "No user logged in.";

      const { error: deleteError } = await supabase
        .from("user")
        .update({ user_role: "deleted" })
        .eq("user_id", state.user.user_id)
        .select("*")
        .single();

      if (deleteError) return deleteError.message ?? String(deleteError);

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) return signOutError.message ?? String(signOutError);

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
        reactivateUser,
        logOut,
        updateUser,
        disableUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthState;
