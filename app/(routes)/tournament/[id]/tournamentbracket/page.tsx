import type { Metadata } from "next";
import TournamentBracketPage from "./_components/TournamentBracketPage";

export const metadata: Metadata = {
  title: "Bracket",
  description: "Ultimate STEM",
};

const TournamentBracket = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <TournamentBracketPage tournamentId={id} />;
};

export default TournamentBracket;