"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";

const TournamentPage = () => {
  const router = useRouter();
  return (
    <div className="flex w-full flex-col items-center mt-10 font-bold">
      <h1 className="mb-25 text-4xl">{'{tournament name}'}</h1>
      <div className="flex w-full justify-center gap-25 text-center font-bold text-2xl">
        <div className="w-full max-w-md border-2 border-gray-700 p-12">
          <h2 className="my-10">Submissions</h2>
          <UsButton variant="blue" onClick={() => {router.push("/dashboard/tournament/submissions")}}>
            Submissions
          </UsButton>
        </div>
        <div className="w-full max-w-md border-2 border-gray-700 p-12">
          <h2 className="my-10">Tournament Bracket</h2>
          <UsButton variant="blue" onClick={() => {router
            .push("./tournament/tournamentbracket")}}>
            Tournament Bracket
          </UsButton>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;