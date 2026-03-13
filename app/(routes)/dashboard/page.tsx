import type { Metadata, NextPage } from "next";
import DashboardPage from "./DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ultimate STEM User Dashboard",
};

const Dashboard: NextPage = () => {
  return <DashboardPage />;
};

export default Dashboard;