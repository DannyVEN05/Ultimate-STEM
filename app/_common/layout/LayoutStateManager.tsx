"use client";

import AuthState from "@/app/_context/auth/AuthState";

const LayoutStateManager = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AuthState>
        {children}
      </AuthState>
    </>
  );
};

export default LayoutStateManager;