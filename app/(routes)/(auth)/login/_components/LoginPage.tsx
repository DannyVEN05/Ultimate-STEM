"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import UsWidget from "@/app/_common/ui/other/UsWidget";
import AuthContext from "@/app/_context/auth/AuthContext";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect } from "react";

type LoginFormState = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const router = useRouter();

  const { logIn, user } = useContext(AuthContext);

  const [form, setForm] = React.useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [router, user]);

  const updateField = (key: keyof LoginFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSuccess(null);

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    const response = await logIn({ email: form.email.trim(), password: form.password });
    if (response === null) {
      setSuccess("Login successful! Redirecting...");
      router.push('/dashboard');
    } else {
      setError("Login failed: " + response);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <UsWidget title="Login">
        {success ? (
          <p className="text-green-500 text-sm mb-4">{success}</p>
        ) : (
          <form className="grid grid-cols-2 gap-3" onSubmit={onSubmit}>

            {error && (
              <div className="flex justify-center col-span-2">
                <p className="text-red-500 text-sm mb-2">
                  {error}
                </p>
              </div>
            )}

            <div className="col-span-1">
              <label htmlFor="email" className="block text-sm font-medium ml-1">Email:</label>
              <UsInput
                id="email"
                name="email"
                autoComplete="email"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.email}
                onChange={updateField("email")}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="password" className="block text-sm font-medium ml-1">Password:</label>
              <UsInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.password}
                onChange={updateField("password")}
              />
            </div>

            <div className="col-span-2 mt-4">
              <UsButton
                variant="blue"
                className="w-full"
                type="submit"
                disabled={isSubmitting}
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