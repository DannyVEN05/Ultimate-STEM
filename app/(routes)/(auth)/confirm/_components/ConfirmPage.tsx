"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const MAX_USER_CHECK_ATTEMPTS = 4;
const USER_CHECK_RETRY_DELAY_MS = 250;

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
      const otpType = url.searchParams.get("type");
      const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      let authOperationFailed = false;
      const waitForSignedInUser = async () => {
        for (let attemptNumber = 0; attemptNumber < MAX_USER_CHECK_ATTEMPTS; attemptNumber++) {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (!error && user) return user;
          if (error && attemptNumber === MAX_USER_CHECK_ATTEMPTS - 1) {
            console.warn("Unable to load signed-in user during confirmation:", error.message);
          }
          if (attemptNumber < MAX_USER_CHECK_ATTEMPTS - 1) {
            await new Promise((resolve) => setTimeout(resolve, USER_CHECK_RETRY_DELAY_MS));
          }
        }
        return null;
      };

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Error confirming email:", error.message);
            authOperationFailed = true;
          }
        } else if (tokenHash && otpType) {
          const allowedTypes = new Set(["signup", "recovery", "magiclink", "invite", "email_change"]);
          if (allowedTypes.has(otpType)) {
            const { error } = await supabase.auth.verifyOtp({
              type: otpType as "signup" | "recovery" | "magiclink" | "invite" | "email_change",
              token_hash: tokenHash,
            });
            if (error) {
              console.error("Error confirming email:", error.message);
              authOperationFailed = true;
            }
          } else {
            setStatus("This confirmation link is invalid or expired.");
            return;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("Error setting session:", error.message);
            authOperationFailed = true;
          }
        } else {
          setStatus("This confirmation link is invalid or expired.");
          return;
        }

        const user = await waitForSignedInUser();

        if (user) {
          setStatus("Email confirmed. Redirecting...");
          router.replace("/dashboard");
        } else if (authOperationFailed) {
          setStatus("This confirmation link is invalid or expired.");
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
