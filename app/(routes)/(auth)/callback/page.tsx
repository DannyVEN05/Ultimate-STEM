import { Metadata, NextPage } from "next";
import CallbackPage from "./CallbackPage";

export const metadata: Metadata = {
  title: "Callback",
  description: "Callback page for email confirmation",
};

const Callback: NextPage = () => {
  return <CallbackPage />;
};

export default Callback;