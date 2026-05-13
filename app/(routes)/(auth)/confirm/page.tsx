import { Metadata, NextPage } from "next";
import ConfirmPage from "./_components/ConfirmPage";

export const metadata: Metadata = {
  title: "Confirm Email",
  description: "Confirm your account to finish signing in",
};

const Confirm: NextPage = () => {
  return <ConfirmPage />;
};

export default Confirm;
