"use client";

import { createContext } from "react";
import type { User } from "@/app/_types/model/User";
import { LogInData } from "./AuthState";

export type AuthContextType = {
  user: User | null;
  logIn: (logInData: LogInData) => Promise<null | string>;
};

const AuthContext = createContext({} as AuthContextType);

export default AuthContext;