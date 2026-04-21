import type { Metadata, NextPage } from "next";
import TournamentPage from "./_components/TournamentPage";

export const metadata: Metadata = {
  title: "Tournament",
  description: "Ultimate STEM",
};

const Tournament = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <TournamentPage id={id} />;
};

export default Tournament;