"use client";

import { createContext } from "react";
import type { User } from "@/app/_types/model/User";
import { LogInData, SignUpData, ReactivateProfileData } from "./AuthState";

export type AuthFailure = {
  message: string;
  code?: string;
  status?: number;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signUp: (signUpData: SignUpData) => Promise<null | string>;
  logIn: (logInData: LogInData) => Promise<null | AuthFailure>;
  reactivateUser: (signUpData: ReactivateProfileData, oldPassword: string) => Promise<null | string>;
  logOut: () => Promise<null | string>;
  updateUser: (user: User) => Promise<null | string>;
  disableUser: () => Promise<null | string>;
};

const AuthContext = createContext({} as AuthContextType);

export default AuthContext;
