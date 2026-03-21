import type { Metadata, NextPage } from "next";
import TournamentPage from "./_components/TournamentPage";

export const metadata: Metadata = {
  title: "Tournament",
  description: "Ultimate STEM",
};

const Tournament: NextPage = () => {
  return <TournamentPage />;
};

export default Tournament;