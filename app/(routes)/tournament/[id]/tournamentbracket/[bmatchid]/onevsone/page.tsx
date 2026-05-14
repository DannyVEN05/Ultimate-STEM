import type { Metadata, NextPage } from "next";
import OneVsOnePage from "./_components/OneVsOnePage";

export const metadata: Metadata = {
  title: "Battle Page",
  description: "Ultimate STEM",
};

type PageProps = {
  params: Promise<{
    id: string;
    bmatchid: string;
  }>;
};

const OneVsOne = async ({params}: PageProps) => {
  const { id, bmatchid} = await params;
  return (
  <OneVsOnePage 
    tournamentId={id}
    bmatchId={bmatchid}
  />
  );
};


export default OneVsOne;