import { Metadata, NextPage } from "next";
import AdminTournamentsPage from "./_components/AdminTournamentsPage";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "View all tournaments, statuses, and winners",
};

const Tournaments: NextPage = () => {
  return <AdminTournamentsPage />;
};

export default Tournaments;
