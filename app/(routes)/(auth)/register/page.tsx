import { Metadata, NextPage } from "next";
import RegisterPage from "./_components/RegisterPage";

export const metadata: Metadata = {
  title: "Register",
  description: "Create an account to for the Ultimate STEM platform",
};

const Register: NextPage = () => {
  return <RegisterPage />;
};

export default Register;