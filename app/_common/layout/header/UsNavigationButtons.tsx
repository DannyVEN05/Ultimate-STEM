"use client";

import AuthContext from "@/app/_context/auth/AuthContext";
import { useRouter } from "next/navigation";
import { use, useContext, useEffect } from "react";

const UsNavigationButtons = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  return (
    <div className="flex items-center space-x-6 text-sm font-medium">
      <button onClick={() => router.push("/dashboard")} className="hover:cursor-pointer hover:text-primary transition-colors">
        Active Battles
      </button>
      <button onClick={() => router.push("")} className="hover:cursor-pointer hover:text-primary transition-colors">
        Archives
      </button>
      {user?.user_role == "admin" && (
        <button onClick={() => router.push("/admin")} className="hover:cursor-pointer hover:text-primary transition-colors">
          Admin
        </button>
      )}
    </div>
  );
};

export default UsNavigationButtons;