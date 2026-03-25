"use client";

import React, { useContext } from "react";
import UsMenuButton from "./UsMenuButton";
import UsButton from "../../ui/buttons/UsButton";
import { useRouter } from "next/navigation";
import AuthContext from "@/app/_context/auth/AuthContext";

const UsAuthMenu: React.FC = ({ }) => {
  const router = useRouter();

  const { user } = useContext(AuthContext);

  return (
    <>
      {user ? (
        <div className="flex justify-end items-center gap-10 mr-4">
          <span>Hello, {user.user_firstname} {user.user_lastname}</span>
          <UsMenuButton />
        </div>
      ) : (
        <div className="flex justify-end items-center gap-4">
          <UsButton onClick={() => router.push("/login")}>Login</UsButton>
          <UsButton onClick={() => router.push("/register")}>Register</UsButton>
        </div>
      )}
    </>
  );
};

export default UsAuthMenu;