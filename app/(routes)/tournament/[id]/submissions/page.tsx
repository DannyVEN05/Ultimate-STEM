import type { Metadata, NextPage } from "next";
import SubmissionsPage from "./_components/SubmissionsPage";

export const metadata: Metadata = {
  title: "Submissions",
  description: "Ultimate STEM",
};

const Submissions: NextPage = () => {
  return <SubmissionsPage />;
};

export default Submissions;