import type { Metadata, NextPage } from "next";
import BookBuilderPage from "./_components/BookBuilderPage";

export const metadata: Metadata = {
  title: "BookBuilder",
  description: "Ultimate STEM",
};

const Bookbuilder: NextPage = () => {
  return <BookBuilderPage />;
};

export default Bookbuilder;