"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import UsInput from "@/app/_common/ui/inputs/UsInput";
import UsWidget from "@/app/_common/ui/other/UsWidget";
import AuthContext from "@/app/_context/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useContext } from "react";

type RegisterFormState = {
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_phone_number: string;
  user_dob: string;
  user_password: string;
  confirm_password: string;
};

const RegisterPage: React.FC = () => {
  const router = useRouter();

  const { signUp } = useContext(AuthContext);

  const [form, setForm] = React.useState<RegisterFormState>({
    user_firstname: "",
    user_lastname: "",
    user_email: "",
    user_phone_number: "",
    user_dob: "",
    user_password: "",
    confirm_password: "",
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

    const { data: exists, error } = await supabase.rpc("email_exists", { email_to_check: form.user_email.trim() });

    if (error) {
      setError("An error occurred while checking the email: " + error.message);
      return;
    }

    if (exists) {
      setError("An account with this email already exists.");
      return;
    }

    if (form.user_password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.user_password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const error = await signUp({
        email: form.user_email.trim().toLowerCase(),
        password: form.user_password,
        user_firstname: form.user_firstname.trim(),
        user_lastname: form.user_lastname.trim(),
        user_phone_number: form.user_phone_number.trim(),
        user_dob: form.user_dob.trim(),
      });


      if (error) {
        setError("Registration failed: " + error);
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
                className="w-full"
                value={form.user_firstname}
                onChange={updateField("user_firstname")}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="lastName" className="block text-sm font-medium ml-1">Last Name:</label>
              <UsInput
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
                className="w-full"
                value={form.user_lastname}
                onChange={updateField("user_lastname")}
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
                className="w-full"
                value={form.user_email}
                onChange={updateField("user_email")}
                onBlur={() => setForm((prev) => ({ ...prev, user_email: form.user_email.trim().toLowerCase() }))}
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="phoneNumber" className="block text-sm font-medium ml-1">Phone Number:</label>
              <UsInput
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                className="w-full"
                value={form.user_phone_number}
                onChange={updateField("user_phone_number")}
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
                className="w-full"
                value={form.user_dob}
                onChange={updateField("user_dob")}
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
                className="w-full"
                value={form.user_password}
                onChange={updateField("user_password")}
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
                className="w-full"
                value={form.confirm_password}
                onChange={updateField("confirm_password")}
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