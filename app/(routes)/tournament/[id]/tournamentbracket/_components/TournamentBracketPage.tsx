"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";

const TournamentBracketPage = () => {
  const router = useRouter();
  return (
    <div className="flex text-4xl w-full">
      <UsButton variant="red" onClick={() => {router.push("./")}}>
        Back
      </UsButton>
      <h1>This is the tournament bracket page.</h1>
      <UsButton variant="blue" onClick={() => {router.push("./tournamentbracket/onevsone")}}>
        Enter stage
      </UsButton>
    </div>
  );
};

export default TournamentBracketPage;