import type { Metadata, NextPage } from "next";
import TournamentPage from "./_components/TournamentPage";

export const metadata: Metadata = {
  title: "Tournament",
  description: "Ultimate STEM",
};

const Tournament = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ readonly?: string }>;
}) => {
  const { id } = await params;
  const { readonly } = await searchParams;
  return <TournamentPage id={id} readonly={readonly === "true"} />;
};

export default Tournament;