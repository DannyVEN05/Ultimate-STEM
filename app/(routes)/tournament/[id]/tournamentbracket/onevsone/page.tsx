import type { Metadata, NextPage } from "next";
import OneVsOnePage from "./_components/OneVsOnePage";

export const metadata: Metadata = {
  title: "Battle Page",
  description: "Ultimate STEM",
};

const OneVsOne: NextPage = () => {
  return <OneVsOnePage />;
};

export default OneVsOne;