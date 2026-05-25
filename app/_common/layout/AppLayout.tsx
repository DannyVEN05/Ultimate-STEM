"use client";

import React, { useContext, useEffect } from "react";
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

  useEffect(() => {
    if (typeof performance !== "undefined" && typeof performance.measure === "function") {
      const origMeasure = performance.measure.bind(performance);
      // patch to avoid RuntimeErrors from negative timestamps in dev
      // (Next/Turbopack instrumentation can sometimes produce invalid values)
      performance.measure = (...args: any[]) => {
        try {
          // @ts-ignore
          return origMeasure(...args);
        } catch (e) {
          // swallow the error to avoid crashing the app during rapid reloads
          // eslint-disable-next-line no-console
          // console.warn("performance.measure ignored error:", e);
          return undefined as any;
        }
      };
    }
  }, []);

  return (
    <div className="h-dvh flex flex-col overflow-hidden cursor-default">

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