import type { Metadata, NextPage } from "next";
import OneVsOnePage from "./_components/OneVsOnePage";

export const metadata: Metadata = {
  title: "changeit",
  description: "Ultimate STEM",
};

const OneVsOne: NextPage = () => {
  return <OneVsOnePage />;
};

export default OneVsOne;