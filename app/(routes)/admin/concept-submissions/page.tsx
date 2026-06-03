import { Metadata, NextPage } from "next";
import AdminConceptSubmissionsPage from "./_components/AdminConceptSubmissionsPage";

export const metadata: Metadata = {
  title: "Concept Submissions",
  description: "Review and moderate concept submissions",
};

const ConceptSubmissions: NextPage = () => {
  return <AdminConceptSubmissionsPage />;
};

export default ConceptSubmissions;
