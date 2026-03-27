"use client";

import React, { useContext } from "react";
import UsHeader from "./header/UsHeader";
import UsFooter from "./UsFooter";
import AuthContext from "@/app/_context/auth/AuthContext";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  children?: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

const AppLayout: React.FC<Props> = ({
  children,
  showHeader = true,
  showFooter = true,
}) => {
  const { isLoading } = useContext(AuthContext);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          {showHeader && <UsHeader />}

          <main className="flex-1 min-h-0 overflow-y-auto p-4">
            {children}
          </main>

          {showFooter && <UsFooter />}
        </>
      )}

    </div>
  );
};

export default AppLayout;