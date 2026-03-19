import type { Metadata, NextPage } from "next";
import SwipeModePage from "./_components/SwipeModePage";

export const metadata: Metadata = {
  title: "SwipeMode",
  description: "Ultimate STEM",
};

const Swipemode: NextPage = () => {
  return <SwipeModePage />;
};

export default Swipemode;