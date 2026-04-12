"use client";

import AuthState from "@/app/_context/auth/AuthState";
import BookState from "@/app/_context/book/BookState";

const LayoutStateManager = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AuthState>
        <BookState>
          {children}
        </BookState>
      </AuthState>
    </>
  );
};

export default LayoutStateManager;