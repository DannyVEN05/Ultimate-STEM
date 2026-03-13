import { Metadata, NextPage } from "next";
import AdminPage from "./_components/AdminPage";

export const metadata: Metadata = {
  title: "Admin",
  description: "Ultimate STEM Admin Dashboard",
};

const Admin: NextPage = () => {
  return <AdminPage />;
};

export default Admin;