import { Metadata, NextPage } from "next";
import ResetPasswordPage from "./_components/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

const ResetPassword: NextPage = () => {
  return <ResetPasswordPage />;
};

export default ResetPassword;
