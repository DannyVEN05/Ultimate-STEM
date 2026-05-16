"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { JSX } from "react";

// ----------------------------
// CONSTANTS
// ----------------------------
const MW = 160;
const MH = 52;   
const RG = 45;   
const VG = 12;  
const RL = 36;
const FG = 35;   

// ----------------------------
// TYPES
// ----------------------------
interface BracketMatch {
  id: number | string;
  bmatchId: string;

  roundNumber: number;

  nameA: string;
  nameB: string;

  votesA: number;
  votesB: number;

  status: string;

  nextMatchId: number | string | null;

  side: "left" | "right" | "final";

  indexInRound: number;

  tournamentSubAId: string;
  tournamentSubBId: string;
}

// ----------------------------
// HELPERS
// ----------------------------
function trunc(
  s: string | null | undefined,
  n: number
) {
  if (!s) return "TBD";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function nextPowerOfTwo(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

// ----------------------------
// FULL SEED BRACKET GENERATOR
// ----------------------------
function buildFullSeededBracket(subs: any[]): BracketMatch[] {
  if (!subs.length) return [];

  const size = nextPowerOfTwo(subs.length);
  const totalRounds = Math.log2(size);

  const padded = [...subs];

  while (padded.length < size) {
    padded.push(null);
  }

  function generateSeedOrder(n: number): number[] {
    let seeds = [1, 2];

    while (seeds.length < n) {
      const next: number[] = [];
      const sum = seeds.length * 2 + 1;

      seeds.forEach((s) => {
        next.push(s);
        next.push(sum - s);
      });

      seeds = next;
    }

    return seeds;
  }

  const seedOrder = generateSeedOrder(size);
  const seeded = seedOrder.map((i) => padded[i - 1]);

  let matchId = 1;
  const roundSlots: number[][] = [];

  let count = size / 2;

  for (let r = 0; r < totalRounds; r++) {
    roundSlots.push(
      Array.from({ length: count }, () => matchId++)
    );
    count = Math.floor(count / 2);
  }

  const matches: BracketMatch[] = [];

  const r1Half = Math.ceil(roundSlots[0].length / 2);

  for (let r = 0; r < totalRounds; r++) {
    roundSlots[r].forEach((id, i) => {
      const nextMatchId =
        roundSlots[r + 1]?.[Math.floor(i / 2)] ?? null;

      const teamA = r === 0 ? seeded[i * 2] : null;
      const teamB = r === 0 ? seeded[i * 2 + 1] : null;

      let side: "left" | "right" | "final" = "left";

      if (r === totalRounds - 1) {
        side = "final";
      } else if (r === 0) {
        side = i < r1Half ? "left" : "right";
      } else {
        side = i < roundSlots[r].length / 2 ? "left" : "right";
      }

      matches.push({
        id,
        bmatchId: `generated-${id}`,

        roundNumber: r + 1,

        nameA: teamA?.concept?.concept_title ?? "TBD",
        nameB: teamB?.concept?.concept_title ?? "TBD",

        votesA: 0,
        votesB: 0,

        status: "scheduled",

        nextMatchId,

        side,

        indexInRound: i,

        tournamentSubAId: teamA?.tournamentsub_id
          ? String(teamA.tournamentsub_id)
          : "",

        tournamentSubBId: teamB?.tournamentsub_id
          ? String(teamB.tournamentsub_id)
          : "",
      });
    });
  }

  return matches;
}

// ----------------------------
// SVG BRACKET
// ----------------------------
function BracketSVG({
  matches,
  onMatchClick,
}: {
  matches: BracketMatch[];
  onMatchClick: (m: BracketMatch) => void;
}) {
  if (!matches.length) return null;

  const rounds = [...new Set(matches.map((m) => m.roundNumber))].sort((a, b) => a - b);

  const finalRound = rounds[rounds.length - 1];

  const nonFinal = rounds.filter((r) => r !== finalRound);

  const leftR1 = matches.filter(
    (m) => m.roundNumber === rounds[0] && m.side === "left"
  );

  const rightR1 = matches.filter(
    (m) => m.roundNumber === rounds[0] && m.side === "right"
  );

  const sideWidth = nonFinal.length * (MW + RG);
  const finalX = sideWidth + FG;

  const totalW = finalX * 2 + MW;

  const totalH =
    RL +
    Math.max(leftR1.length, rightR1.length) *
      (MH + VG) *
      1.1 +
    80;

  const pos: Record<string | number, { x: number; y: number }> = {};

  nonFinal.forEach((round, rIdx) => {
    const leftMs = matches.filter(
      (m) => m.roundNumber === round && m.side === "left"
    );

    const rightMs = matches.filter(
      (m) => m.roundNumber === round && m.side === "right"
    );

    const lSpacing = ((totalH - RL) / Math.max(leftR1.length, 1)) * Math.pow(2, rIdx);
    const rSpacing = ((totalH - RL) / Math.max(rightR1.length, 1)) * Math.pow(2, rIdx);

    const lX = rIdx * (MW + RG);
    const rX = totalW - MW - rIdx * (MW + RG);

    leftMs.forEach((m, i) => {
      pos[m.id] = {
        x: lX,
        y: RL + i * lSpacing + lSpacing / 2 - MH / 2,
      };
    });

    rightMs.forEach((m, i) => {
      pos[m.id] = {
        x: rX,
        y: RL + i * rSpacing + rSpacing / 2 - MH / 2,
      };
    });
  });

  const finalMatch = matches.find((m) => m.side === "final");

  if (finalMatch) {
    pos[finalMatch.id] = {
      x: finalX,
      y: totalH / 2 - MH / 2,
    };
  }

  const connectors: JSX.Element[] = [];

  matches.forEach((m) => {
    if (!m.nextMatchId) return;

    const from = pos[m.id];
    const to = pos[m.nextMatchId];

    if (!from || !to) return;

    const fy = from.y + MH / 2;
    const ty = to.y + MH / 2;

    if (m.side === "left") {
      const fx = from.x + MW;
      const tx = to.x;
      const mx = fx + (tx - fx) / 2;

      connectors.push(
        <path
          key={`c-${m.id}-${m.nextMatchId}`}
          d={`M${fx} ${fy} H${mx} V${ty} H${tx}`}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={1.5}
        />
      );
    } else {
      const fx = from.x;
      const tx = to.x + MW;
      const mx = fx - (fx - tx) / 2;

      connectors.push(
        <path
          key={`c-${m.id}-${m.nextMatchId}`}
          d={`M${fx} ${fy} H${mx} V${ty} H${tx}`}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={1.5}
        />
      );
    }
  });

  const cards: JSX.Element[] = [];

  matches.forEach((m) => {
    const p = pos[m.id];
    if (!p) return;

    cards.push(
      <g
        key={m.id}
        onClick={() => onMatchClick(m)}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={p.x}
          y={p.y}
          width={MW}
          height={MH}
          rx={6}
          fill="#fff"
          stroke="#e0e0e0"
        />

        <text x={p.x + 10} y={p.y + 18} fontSize={11}>
          {trunc(m.nameA, 20)}
        </text>

        <text x={p.x + 10} y={p.y + 42} fontSize={11}>
          {trunc(m.nameB, 20)}
        </text>
      </g>
    );
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={totalW} height={totalH}>
        {connectors}
        {cards}
      </svg>
    </div>
  );
}

// ----------------------------
// PAGE
// ----------------------------
export default function BracketPage({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data } = await supabase
        .from("tournament_submission")
        .select("*, concept(*)")
        .eq("tournament_id", tournamentId)
        .eq("tournamentsub_status", "approved")
        .order("tournamentsub_likes", {
          ascending: false,
        });

      if (!data) {
        setMatches([]);
        setLoading(false);
        return;
      }

      setMatches(buildFullSeededBracket(data));
      setLoading(false);
    }

    load();
  }, [tournamentId]);

  const handleMatchClick = (m: BracketMatch) => {
    router.push(`./onevsone?bmatch=${m.bmatchId}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Tournament Bracket</h1>

      <BracketSVG matches={matches} onMatchClick={handleMatchClick} />
    </div>
  );
}