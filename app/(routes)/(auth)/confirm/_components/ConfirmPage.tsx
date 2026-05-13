"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";

const ConfirmPage = () => {
  const router = useRouter();
  const hasProcessedRef = useRef(false);
  const status = "Confirming your email...";

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const handleConfirm = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const otpType = url.searchParams.get("type");
      const hasHashToken = url.hash.includes("access_token=") || url.hash.includes("refresh_token=");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error("Error confirming email:", error.message);
        } else if (tokenHash && otpType) {
          const allowedTypes = new Set(["signup", "recovery", "magiclink", "invite", "email_change"]);
          if (allowedTypes.has(otpType)) {
            const { error } = await supabase.auth.verifyOtp({
              type: otpType as "signup" | "recovery" | "magiclink" | "invite" | "email_change",
              token_hash: tokenHash,
            });
            if (error) console.error("Error confirming email:", error.message);
          }
        } else if (hasHashToken) {
          const { error } = await supabase.auth.getSession();
          if (error) console.error("Error loading session:", error.message);
        }

        const { error: userError } = await supabase.auth.getUser();
        if (userError) console.error("Error fetching user:", userError.message);
      } finally {
        router.replace("/dashboard");
      }
    };

    handleConfirm();
  }, [router]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Spinner className="size-4" />
        <span>{status}</span>
      </div>
    </div>
  );
};

export default ConfirmPage;
