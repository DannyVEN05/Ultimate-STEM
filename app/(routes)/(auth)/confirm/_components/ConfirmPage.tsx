"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const ConfirmPage = () => {
  const router = useRouter();
  const hasProcessedRef = useRef(false);
  const [status, setStatus] = useState("Confirming your email...");

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const handleConfirm = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const token = url.searchParams.get("token");
      const email = url.searchParams.get("email");
      const otpType = url.searchParams.get("type");
      const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const allowedTypes = new Set(["signup", "recovery", "magiclink", "invite", "email_change"]);

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error("Error confirming email:", error.message);
        } else if (tokenHash && otpType) {
          if (allowedTypes.has(otpType)) {
            const { error } = await supabase.auth.verifyOtp({
              type: otpType as "signup" | "recovery" | "magiclink" | "invite" | "email_change",
              token_hash: tokenHash,
            });
            if (error) console.error("Error confirming email:", error.message);
          } else {
            setStatus("This confirmation link is invalid or expired.");
            return;
          }
        } else if (token && email && otpType) {
          if (allowedTypes.has(otpType)) {
            const { error } = await supabase.auth.verifyOtp({
              type: otpType as "signup" | "recovery" | "magiclink" | "invite" | "email_change",
              token,
              email,
            });
            if (error) console.error("Error confirming email:", error.message);
          } else {
            setStatus("This confirmation link is invalid or expired.");
            return;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) console.error("Error setting session:", error.message);
        } else {
          const { data: { session }, error: existingSessionError } = await supabase.auth.getSession();
          if (existingSessionError) console.error("Error loading session:", existingSessionError.message);
          if (session) {
            setStatus("Session active. Redirecting...");
            router.replace("/dashboard");
            return;
          }
          setStatus("This confirmation link is invalid or expired.");
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error("Error loading session:", sessionError.message);

        if (session) {
          setStatus("Email confirmed. Redirecting...");
          router.replace("/dashboard");
        } else {
          setStatus("Email confirmed, but we could not sign you in. Please log in.");
        }
      } catch (error) {
        setStatus("We could not confirm your email. Please try again.");
        console.error("Error confirming email:", error);
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
