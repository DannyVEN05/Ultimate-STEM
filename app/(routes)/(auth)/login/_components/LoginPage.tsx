"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { Input } from "@/components/ui/input";
import UsWidget from "@/app/_common/ui/other/UsWidget";
import AuthContext from "@/app/_context/auth/AuthContext";
import type { AuthFailure } from "@/app/_context/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect } from "react";

type LoginFormState = {
  user_email: string;
  user_password: string;
};

const LoginPage: React.FC = () => {
  const router = useRouter();

  const { logIn, user } = useContext(AuthContext);

  const [form, setForm] = React.useState<LoginFormState>({
    user_email: "",
    user_password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [resetMessage, setResetMessage] = React.useState<string | null>(null);
  const [showResendLink, setShowResendLink] = React.useState(false);
  const isBusy = isSubmitting || isResending || isResetting;

  const shouldOfferResend = (authFailure: AuthFailure) => {
    return authFailure.code === "email_not_confirmed";
  };

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [router, user]);

  const updateField = (key: keyof LoginFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBusy) return;

    setSuccess(null);
    setResendMessage(null);
    setResetMessage(null);
    setShowResendLink(false);
    setError(null);

    if (!form.user_email.trim()) {
      setError("Email is required.");
      return;
    }

    if (form.user_password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await logIn({ email: form.user_email.trim(), password: form.user_password });
      if (response === null) {
        setSuccess("Login successful! Redirecting...");
        router.push('/dashboard');
      } else {
        const errorMessage = "Login failed: " + response.message;
        const shouldShowResend = shouldOfferResend(response);
        setError(errorMessage);
        setShowResendLink(shouldShowResend);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendConfirmation = async () => {
    if (isBusy) return;
    const email = form.user_email.trim().toLowerCase();
    if (!email) {
      setError("Email is required.");
      setShowResendLink(false);
      return;
    }

    setResetMessage(null);
    setIsResending(true);
    try {
      const emailRedirectTo = `${window.location.origin}/confirm`;
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (resendError) {
        setError("Resend failed: " + resendError.message);
        setShowResendLink(true);
        return;
      }

      setError(null);
      setShowResendLink(false);
      setResendMessage("An email has been sent to you.\nPlease click the link to confirm your account.");
    } finally {
      setIsResending(false);
    }
  };

  const onForgotPassword = async () => {
    if (isBusy) return;
    const email = form.user_email.trim().toLowerCase();

    setSuccess(null);
    setResendMessage(null);
    setResetMessage(null);
    setShowResendLink(false);
    setError(null);

    if (!email) {
      setError("Email is required.");
      return;
    }

    setIsResetting(true);
    try {
      const redirectTo = `${window.location.origin}/reset`;
      await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      setResetMessage("An email has been sent to you.\nPlease click the link to reset your password.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <UsWidget title="Login" sizeOptions={{ width: 350 }}>
        {success ? (
          <p className="text-green-500 text-sm mb-4">{success}</p>
        ) : (
          <form className="grid grid-cols-2 gap-3" onSubmit={onSubmit}>

            {resendMessage && (
              <div className="flex justify-center col-span-2">
                <p className="text-green-500 text-sm mb-2 text-center whitespace-pre-line">
                  {resendMessage}
                </p>
              </div>
            )}

            {resetMessage && (
              <div className="flex justify-center col-span-2">
                <p className="text-green-500 text-sm mb-2 text-center whitespace-pre-line">
                  {resetMessage}
                </p>
              </div>
            )}

            {error && !resendMessage && !resetMessage && (
              <div className="flex flex-col items-center col-span-2">
                <p className="text-red-500 text-sm mb-2 text-center">
                  {error}
                </p>
                {showResendLink && (
                  <UsButton
                    variant="white"
                    type="button"
                    className="w-full"
                    disabled={isBusy}
                    onClick={onResendConfirmation}
                  >
                    {isResending ? "Resending..." : "Resend Link"}
                  </UsButton>
                )}
              </div>
            )}

            <div className="col-span-2">
              <label htmlFor="email" className="block text-sm font-medium ml-1">Email:</label>
              <Input
                id="email"
                name="email"
                autoComplete="email"
                required
                className="w-full"
                value={form.user_email}
                onChange={updateField("user_email")}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="password" className="block text-sm font-medium ml-1">Password:</label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full"
                value={form.user_password}
                onChange={updateField("user_password")}
              />
            </div>

            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                className="text-sm text-blue-500 hover:underline hover:cursor-pointer disabled:opacity-50 disabled:cursor-default disabled:no-underline"
                disabled={isBusy || form.user_email.trim() === ""}
                onClick={onForgotPassword}
              >
                {isResetting ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <div className="col-span-2">
              <UsButton
                variant="blue"
                className="w-full"
                type="submit"
                disabled={isBusy}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </UsButton>
            </div>

          </form>
        )}

      </UsWidget>
    </div>
  );
};

export default LoginPage;
