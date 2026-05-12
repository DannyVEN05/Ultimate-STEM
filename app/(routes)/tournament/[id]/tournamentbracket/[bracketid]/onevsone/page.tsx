import type { Metadata, NextPage } from "next";
import OneVsOnePage from "./_components/OneVsOnePage";

export const metadata: Metadata = {
  title: "Battle Page",
  description: "Ultimate STEM",
};

type PageProps = {
  params: Promise<{
    id: string;
    bracketid: string;
  }>;
};

const OneVsOne = async ({params}: PageProps) => {
  const { id, bracketid} = await params;
  return (
  <OneVsOnePage 
    tournamentId={id}
    bracketId={bracketid}
  />
  );
};


export default OneVsOne;