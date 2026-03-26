"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import UsWidget from "@/app/_common/ui/other/UsWidget";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React from "react";

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage: React.FC = () => {
  const router = useRouter();

  const [form, setForm] = React.useState<RegisterFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const updateField = (key: keyof RegisterFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSuccess(null);

    const { data: exists, error } = await supabase.rpc("email_exists", { email_to_check: form.email.trim() });

    if (error) {
      setError("An error occurred while checking the email: " + error.message);
      return;
    }

    if (exists) {
      setError("An account with this email already exists.");
      return;
    }

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

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phoneNumber: form.phoneNumber.trim(),
            dateOfBirth: form.dateOfBirth,
          },
        },
      });

      if (signUpError) {
        setError("Registration failed: " + signUpError.message);
        return;
      }

      setSuccess("Account created!");
      router.push('/dashboard');
    } catch (err) {
      setError("An unexpected error occurred: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <UsWidget title={`${success ? 'Account Created' : 'Create an account'}`}>
        {success ? (
          <p className="text-green-500">{success}</p>
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
              <label htmlFor="firstName" className="block text-sm font-medium ml-1">First Name:</label>
              <UsInput
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.firstName}
                onChange={updateField("firstName")}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="lastName" className="block text-sm font-medium ml-1">Last Name:</label>
              <UsInput
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.lastName}
                onChange={updateField("lastName")}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="email" className="block text-sm font-medium ml-1">Email:</label>
              <UsInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.email}
                onChange={updateField("email")}
                onBlur={() => setForm((prev) => ({ ...prev, email: form.email.trim().toLowerCase() }))}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="phoneNumber" className="block text-sm font-medium ml-1">Phone Number:</label>
              <UsInput
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.phoneNumber}
                onChange={updateField("phoneNumber")}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium ml-1">Date of Birth:</label>
              <UsInput
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                autoComplete="bday"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.dateOfBirth}
                onChange={updateField("dateOfBirth")}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="password" className="block text-sm font-medium ml-1">Password:</label>
              <UsInput
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.password}
                onChange={updateField("password")}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium ml-1">Confirm Password:</label>
              <UsInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                sizeOptions={{ height: 24 }}
                className="w-full"
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
              />
            </div>

            <div className="col-span-2 mt-4">
              <UsButton
                variant="blue"
                className="w-full"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </UsButton>
            </div>
          </form>
        )}
      </UsWidget>
    </div>
  );
};

export default RegisterPage;