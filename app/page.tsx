import { Metadata, NextPage } from "next";
import HomePage from "./HomePage";

export const metadata: Metadata = {
  title: "Home",
};

const Home: NextPage = () => {
  return <HomePage />;
};

export default Home;