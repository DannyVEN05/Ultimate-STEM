import type { Metadata, NextPage } from "next";
import TournamentBracketPage from "./_components/TournamentBracketPage";

export const metadata: Metadata = {
  title: "Bracket",
  description: "Ultimate STEM",
};

const TournamentBracket = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <TournamentBracketPage id={id} />;
};

export default TournamentBracket;