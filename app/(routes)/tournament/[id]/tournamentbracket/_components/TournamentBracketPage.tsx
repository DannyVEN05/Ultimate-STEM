"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TournamentBracketPage = ({ id }: { id: string }) => {
  const router = useRouter();

  useEffect(() => {
    const fetchBracketData = async () => {
      const { data: brackets, error: bracketsError } = await supabase
        .from("bracket")
        .select(`
          bracket_id,
          bracket_round_number,
          bracket_status,
          tournamentsub_id,
          bracket_match (
            bmatch_id,
            bmatch_concept_a,
            bmatch_concept_b,
            bmatch_concept_a_votes,
            bmatch_concept_b_votes,
            bmatch_status
          )
        `)
        .eq("tournament_id", Number(id))
        .order("bracket_round_number", { ascending: true });

      if (bracketsError) {
        console.error("Error fetching bracket data:", bracketsError);
        return;
      }

      console.log(`Bracket data for tournament ${id}:`, brackets);
    };

    fetchBracketData();
  }, [id]);
  return (
    <div className="flex text-4xl w-full">
      <UsButton variant="red" onClick={() => { router.push("./") }}>
        Back
      </UsButton>
      <h1>This is the tournament bracket page.</h1>
      <UsButton variant="blue" onClick={() => { router.push("./tournamentbracket/onevsone") }}>
        Enter stage
      </UsButton>
    </div>
  );
};

export default TournamentBracketPage;