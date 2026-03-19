import type { Metadata, NextPage } from "next";
import TournamentBracketPage from "./_components/TournamentBracketPage";

export const metadata: Metadata = {
  title: "Bracket",
  description: "Ultimate STEM",
};

const TournamentBracket: NextPage = () => {
  return <TournamentBracketPage />;
};

export default TournamentBracket;