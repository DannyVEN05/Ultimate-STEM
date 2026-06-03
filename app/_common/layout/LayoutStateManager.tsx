"use client";
import AuthState from "@/app/_context/auth/AuthState";
import BookState from "@/app/_context/book/BookState";
import TournamentState from "@/app/_context/tournament/TournamentState";

const LayoutStateManager = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AuthState>
        <TournamentState>
          <BookState>
            {children}
          </BookState>
        </TournamentState>
      </AuthState>
    </>
  );
};

export default LayoutStateManager;