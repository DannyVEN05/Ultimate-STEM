"use client";

import React from "react";
import UsHeader from "./header/UsHeader";
import UsFooter from "./UsFooter";

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
  return (
    <div className="h-dvh flex flex-col overflow-hidden">

      {showHeader && <UsHeader />}

      <main className="flex-1 min-h-0 overflow-y-auto p-4">
        {children}
      </main>

      {showFooter && <UsFooter />}

    </div>
  );
};

export default AppLayout;