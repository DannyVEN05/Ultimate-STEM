"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    bracketsViewer?: {
      render: (data: any, options?: any) => void;
    };
  }
}

interface TournamentSubmission {
  tournamentsub_id: string;
  concept_id: string;
  tournament_id: string;
  tournamentsub_status: string;
}

interface Concept {
  concept_id: string;
  concept_title: string;
  user_id: string;
}

interface User {
  user_id: string;
  user_firstname: string;
  user_lastname: string;
}

interface BracketData {
  stage: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  match: Array<{
    id: string;
    name: string;
    nextMatchId: null;
    tournamentRoundText: string;
    startTime: string;
    state: string;
    participants: Array<{
      id: string;
      name: string;
    }>;
  }>;
  match_game: Array<any>;
  participant: Array<{
    id: string;
    name: string;
  }>;
}

const TournamentBracketPage = () => {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load brackets-viewer CSS
    if (typeof window !== "undefined" && !document.querySelector('link[href*="brackets-viewer"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/brackets-viewer@latest/dist/brackets-viewer.min.css";
      document.head.appendChild(link);
    }

    // Load brackets-viewer library dynamically if not already loaded
    if (typeof window !== "undefined" && !window.bracketsViewer) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/brackets-viewer@latest/dist/brackets-viewer.min.js";
      script.async = true;
      script.onload = () => {
        renderBrackets();
      };
      document.body.appendChild(script);
    } else if (window.bracketsViewer) {
      renderBrackets();
    }
  }, [bracketData]);

  const fetchTournamentSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch tournament submissions for this tournament
      const { data: submissions, error: subsError } = await supabase
        .from("tournament_submission")
        .select("tournamentsub_id, concept_id, tournament_id, tournamentsub_status")
        .eq("tournament_id", tournamentId)
        .eq("tournamentsub_status", "approved"); // Only approved submissions

      if (subsError) throw new Error(subsError.message);
      if (!submissions || submissions.length === 0) {
        setError("No approved submissions found for this tournament");
        return;
      }

      // Get concept IDs and fetch concept details
      const conceptIds = submissions.map((sub: TournamentSubmission) => sub.concept_id);
      const { data: concepts, error: conceptsError } = await supabase
        .from("concept")
        .select("concept_id, concept_title, user_id")
        .in("concept_id", conceptIds);

      if (conceptsError) throw new Error(conceptsError.message);

      // Get user IDs and fetch user details
      const userIds = concepts?.map((concept: Concept) => concept.user_id).filter(Boolean) || [];
      const { data: users, error: usersError } = await supabase
        .from("user")
        .select("user_id, user_firstname, user_lastname")
        .in("user_id", userIds);

      if (usersError) throw new Error(usersError.message);

      // Transform data into brackets-viewer format
      const participants = concepts?.map((concept: Concept, index: number) => {
        const user = users?.find((u: User) => u.user_id === concept.user_id);
        const authorName = user ? `${user.user_firstname} ${user.user_lastname}`.trim() : "Unknown Author";

        return {
          id: concept.concept_id,
          name: `${concept.concept_title} by ${authorName}`,
        };
      }) || [];

      // For now, create a simple single-elimination bracket structure
      // This is a basic example - you'll need to implement proper bracket logic
      const matches = [];
      const numParticipants = participants.length;

      // Create matches for a single elimination tournament
      // This is simplified - in a real implementation you'd use brackets-manager
      if (numParticipants >= 2) {
        for (let i = 0; i < Math.floor(numParticipants / 2); i++) {
          matches.push({
            id: `match-${i + 1}`,
            name: `Match ${i + 1}`,
            nextMatchId: null, // Will be set for bracket progression
            tournamentRoundText: "Round 1",
            startTime: new Date().toISOString(),
            state: "SCHEDULED",
            participants: [
              { id: participants[i * 2]?.id, name: participants[i * 2]?.name },
              { id: participants[i * 2 + 1]?.id, name: participants[i * 2 + 1]?.name },
            ],
          });
        }
      }

      const bracketData = {
        stage: [{
          id: "single-elimination",
          name: "Single Elimination",
          type: "single_elimination",
        }],
        match: matches,
        match_game: [],
        participant: participants,
      };

      setBracketData(bracketData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournament data");
    } finally {
      setLoading(false);
    }
  };

  const renderBrackets = () => {
    if (window.bracketsViewer && bracketData) {
      window.bracketsViewer.render(
        {
          stages: bracketData.stage || [],
          matches: bracketData.match || [],
          matchGames: bracketData.match_game || [],
          participants: bracketData.participant || [],
        },
        {
          selector: ".brackets-viewer",
          clear: true,
        }
      );
    }
  };

  return (
    <div className="w-full h-screen flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <UsButton onClick={() => router.back()}>Back</UsButton>
        <UsButton onClick={fetchTournamentSubmissions} disabled={loading}>
          {loading ? "Loading..." : "Load Bracket"}
        </UsButton>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="brackets-viewer flex-1 overflow-auto bg-white rounded-lg"></div>
    </div>
  );
};
export default TournamentBracketPage;