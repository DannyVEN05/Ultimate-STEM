"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { BracketsViewer } from "brackets-viewer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ----------------------------
// FETCH SUBMISSIONS ONLY
// ----------------------------
async function fetchSubmissions(tournamentId: string) {
  const { data, error } = await supabase
    .from("tournament_submissions")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  return data || [];
}

// ----------------------------
// HELPERS
// ----------------------------

// next power of 2 (required for bracket trees)
function nextPowerOfTwo(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

// ----------------------------
// MAIN BRACKET ENGINE
// ----------------------------
function buildBracketsViewerFormat(submissions: any[], tournamentId: string) {
  const participants = submissions.map((s, index) => ({
    id: String(s.id),
    name: s.team_name || s.name || `Team ${index + 1}`,
    seed: index + 1
  }));

  const participantCount = participants.length;
  const size = nextPowerOfTwo(participantCount);
  const totalRounds = Math.log2(size);

  // ----------------------------
  // STAGE
  // ----------------------------
  const stage = {
    id: `stage-${tournamentId}`,
    tournamentId,
    name: "Main Stage",
    type: "single_elimination",
    number: 1,
    settings: {
      seedOrdering: ["natural"]
    }
  };

  // ----------------------------
  // GROUP
  // ----------------------------
  const group = {
    id: `group-${tournamentId}`,
    stageId: stage.id,
    number: 1
  };

  // ----------------------------
  // MATCH GENERATOR
  // ----------------------------
  const matches: any[] = [];
  let matchId = 1;

  // Round 1 initial pairing
  let currentRoundMatches = size / 2;

  let previousRoundMatchIds: string[] = [];

  for (let round = 0; round < totalRounds; round++) {
    const roundMatches: string[] = [];

    for (let i = 0; i < currentRoundMatches; i++) {
      const match = {
        id: String(matchId++),
        stage_id: stage.id,
        group_id: group.id,
        round_number: round + 1,

        // important for viewer
        child_count: 2,

        opponent1: null,
        opponent2: null,

        // bracket-viewer expects matchGames
        matchGames: [
          {
            id: `${matchId}-g1`,
            number: 1,
            opponent1_score: null,
            opponent2_score: null
          }
        ]
      };

      matches.push(match);
      roundMatches.push(match.id);
    }

    previousRoundMatchIds = roundMatches;
    currentRoundMatches = Math.floor(currentRoundMatches / 2);
  }

  return {
    stage,
    group,
    participants,
    matches
  };
}

// ----------------------------
// PAGE
// ----------------------------
export default function BracketPage({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const submissions = await fetchSubmissions(tournamentId);

      const tournamentData = buildBracketsViewerFormat(submissions, tournamentId);

      setData(tournamentData);

      setLoading(false);
    }

    load();
  }, [tournamentId]);

  if (loading) return <div>Loading bracket...</div>;

  return (
    <div>
      <h1>Tournament Bracket</h1>

      <BracketsViewer data={data} />
    </div>
  );
}