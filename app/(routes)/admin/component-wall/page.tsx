import { Metadata, NextPage } from "next";
import ComponentWallPage from "./ComponentWallPage";

export const metadata: Metadata = {
  title: "Component Wall",
  description: "A page full of different global components for testing and showcasing",
};

const ComponentWall: NextPage = () => {
  return <ComponentWallPage />;
};

export default ComponentWall;