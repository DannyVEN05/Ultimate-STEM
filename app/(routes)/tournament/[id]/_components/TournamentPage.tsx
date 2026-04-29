"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import TournamentContext from "@/app/_context/tournament/TournamentContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type Tournament = {
  tournament_id: number;
  tournament_title: string;
  tournament_genre:string;
  tournament_end_date: string;
  description: string;
};

const TournamentPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const {tournament, setTournament } = useContext(TournamentContext);

  const [tournamentData, setTournamentData] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setTournament(Number(id));

    const getTournamentData = async () => {
      const { data, error } = await supabase
        .from("tournament")
        .select("*")
        .eq("tournament_id", Number(id))
        .single();

        if (error){
          console.error("Error fetching tournament data:", error);
          setLoading(false);
          return;
        }

        setTournamentData(data);
        setLoading(false);
      };
    getTournamentData();

  }, [id, setTournament]);

  if (loading) return <p>Loading tournament...</p>;

  if (!tournamentData) return <p>Tournament not found.</p>;

  return (
    <div className="flex w-full flex-col items-center mt-10 font-bold">
      <h1 className="mb-25 text-4xl">{tournamentData.tournament_title}</h1>
      
      <p className="mb-10 text-lg">Genre: {tournamentData.tournament_genre}</p>
      <p className="mb-10 text-lg"> Ends on:{" "}
      {new Date(tournamentData.tournament_end_date).toLocaleDateString()}</p>

      <div className="flex w-full justify-center gap-25 text-center font-bold text-2xl">
        <div className="w-full max-w-md border-2 border-gray-700 p-12">
          <h2 className="my-10">Submissions</h2>
          <UsButton variant="blue" onClick={() => {router.push(`/tournament/${id}/submissions`)}}>
            Submissions
          </UsButton>
        </div>
        <div className="w-full max-w-md border-2 border-gray-700 p-12">
          <h2 className="my-10">Tournament Bracket</h2>
          <UsButton variant="blue" onClick={() => {router.push(`/tournament/${id}/tournamentbracket`)}}>
            Tournament Bracket
          </UsButton>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;