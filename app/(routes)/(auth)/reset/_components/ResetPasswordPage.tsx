"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import UsWidget from "@/app/_common/ui/other/UsWidget";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

type ResetFormState = {
  password: string;
  confirmPassword: string;
};

type ResetStatus = "loading" | "ready" | "error" | "success";

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const hasProcessedRef = useRef(false);
  const [status, setStatus] = useState<ResetStatus>("loading");
  const [statusMessage, setStatusMessage] = useState("Validating your reset link...");
  const [form, setForm] = useState<ResetFormState>({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const initializeReset = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const token = url.searchParams.get("token");
      const email = url.searchParams.get("email");
      const otpType = url.searchParams.get("type");
      const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      let authOperationFailed = false;

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Error verifying reset link:", exchangeError.message);
            authOperationFailed = true;
          }
        } else if (tokenHash && otpType) {
          if (otpType !== "recovery") {
            setStatus("error");
            setStatusMessage("This reset link is invalid or expired.");
            return;
          }

          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (verifyError) {
            console.error("Error verifying reset link:", verifyError.message);
            authOperationFailed = true;
          }
        } else if (token && email && otpType) {
          if (otpType !== "recovery") {
            setStatus("error");
            setStatusMessage("This reset link is invalid or expired.");
            return;
          }

          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token,
            email,
          });
          if (verifyError) {
            console.error("Error verifying reset link:", verifyError.message);
            authOperationFailed = true;
          }
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error("Error setting reset session:", sessionError.message);
            authOperationFailed = true;
          }
        } else {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) console.error("Error loading session:", sessionError.message);

          if (session) {
            setStatus("ready");
            setStatusMessage("Ready to reset your password.");
            return;
          }

          setStatus("error");
          setStatusMessage("This reset link is invalid or expired.");
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error("Error loading session:", sessionError.message);

        if (session) {
          setStatus("ready");
          setStatusMessage("Ready to reset your password.");
        } else if (authOperationFailed) {
          setStatus("error");
          setStatusMessage("This reset link is invalid or expired.");
        } else {
          setStatus("error");
          setStatusMessage("We could not authenticate this reset link.");
        }
      } catch (resetError) {
        console.error("Error verifying reset link:", resetError);
        setStatus("error");
        setStatusMessage("We could not verify this reset link. Please try again.");
      }
    };

    initializeReset();
  }, []);

  const updateField = (key: keyof ResetFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || status !== "ready") return;

    setError(null);

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (updateError) {
        setError("Reset failed: " + updateError.message);
        return;
      }

      setStatus("success");
      setStatusMessage("Password updated. Redirecting...");
      router.replace("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner className="size-4" />
          <span>{statusMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <UsWidget title={status === "success" ? "Password updated" : "Reset Password"} sizeOptions={{ width: 350 }}>
        {status !== "ready" ? (
          <p className="text-sm text-gray-600 text-center">{statusMessage}</p>
        ) : (
          <form className="grid grid-cols-2 gap-3" onSubmit={onSubmit}>
            {error && (
              <div className="flex justify-center col-span-2">
                <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
              </div>
            )}

            <div className="col-span-2">
              <label htmlFor="password" className="block text-sm font-medium ml-1">New Password:</label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full"
                value={form.password}
                onChange={updateField("password")}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium ml-1">Confirm Password:</label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full"
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
              />
            </div>

            <div className="col-span-2">
              <UsButton
                variant="blue"
                className="w-full"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </UsButton>
            </div>
          </form>
        )}
      </UsWidget>
    </div>
  );
};

export default ResetPasswordPage;
