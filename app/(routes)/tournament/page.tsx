import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Ultimate STEM Admin Dashboard",
};

export default function Tournament() {
  redirect("/dashboard");
}