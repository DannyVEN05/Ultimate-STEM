import { Metadata, NextPage } from "next";
import LoginPage from "./_components/LoginPage";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your account on the Ultimate STEM platform",
};

const Login: NextPage = () => {
  return <LoginPage />;
};

export default Login;