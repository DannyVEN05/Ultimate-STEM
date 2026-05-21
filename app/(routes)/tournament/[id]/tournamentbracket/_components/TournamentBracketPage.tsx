"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { JSX } from "react";

// ----------------------------
// CONSTANTS
// ----------------------------
const MW = 170;
const MH = 56;
const RG = 40; // reduced from 60
const VG = 16;
const RL = 40;
const FG = 30; // reduced from 50

// ----------------------------
// TYPES
// ----------------------------
interface BracketMatch {
  id: number;
  bmatchId: string;
  roundNumber: number;
  slot: number;
  nameA: string;
  nameB: string;
  status: string;
  side: "left" | "right" | "final";
  indexInRound: number;
  nextMatchId: number | null;
  tournamentSubAId: string;
  tournamentSubBId: string;
}

// ----------------------------
// HELPERS
// ----------------------------
function trunc(s: string | null | undefined, n: number) {
  if (!s) return "TBD";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function nextPowerOfTwo(n: number) {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

// ----------------------------
// SVG BRACKET
// ----------------------------
function BracketSVG({
  matches,
  totalRounds,
  onMatchClick,
}: {
  matches: BracketMatch[];
  totalRounds: number;
  onMatchClick: (m: BracketMatch) => void;
}) {
  if (!matches.length) return null;

  const r1Left = matches.filter((m) => m.roundNumber === 1 && m.side === "left");
  const r1Right = matches.filter((m) => m.roundNumber === 1 && m.side === "right");
  const r1Count = Math.max(r1Left.length, r1Right.length);

  const r1UnitH = MH + VG;
  const totalH = RL + r1Count * r1UnitH * 2 + 80;

  const sideRounds = totalRounds - 1;
  const sideWidth = sideRounds * (MW + RG);
  const finalX = sideWidth + FG;
  const totalW = finalX * 2 + MW;

  const pos: Record<number, { x: number; y: number }> = {};

  // ----------------------------
  // POSITIONS
  // ----------------------------
  for (let rIdx = 0; rIdx < sideRounds; rIdx++) {
    const round = rIdx + 1;

    const leftMs = matches
      .filter((m) => m.roundNumber === round && m.side === "left")
      .sort((a, b) => a.indexInRound - b.indexInRound);

    const rightMs = matches
      .filter((m) => m.roundNumber === round && m.side === "right")
      .sort((a, b) => a.indexInRound - b.indexInRound);

    const spacing = r1UnitH * Math.pow(2, rIdx);

    const lX = rIdx * (MW + RG);
    const rX = totalW - MW - rIdx * (MW + RG);

    const slotsPerSide = Math.max(1, r1Count / Math.pow(2, rIdx));

    for (let i = 0; i < slotsPerSide; i++) {
      const cy = RL + i * spacing + spacing / 2;

      const lm = leftMs[i];
      const lId = lm ? lm.id : -(round * 1000 + i * 2);

      pos[lId] = { x: lX, y: cy - MH / 2 };

      const rm = rightMs[i];
      const rId = rm ? rm.id : -(round * 1000 + i * 2 + 1);

      pos[rId] = { x: rX, y: cy - MH / 2 };
    }
  }

  // ----------------------------
  // FINAL POSITION
  // ----------------------------
  const finalMatch = matches.find((m) => m.side === "final");
  const finalSlotId = finalMatch ? finalMatch.id : -9999;

  let finalY = totalH / 2 - MH / 2;

  if (finalMatch) {
    const semis = matches.filter((m) => m.nextMatchId === finalMatch.id);

    if (semis.length === 2) {
      const a = pos[semis[0].id];
      const b = pos[semis[1].id];

      if (a && b) {
        finalY = ((a.y + MH / 2 + b.y + MH / 2) / 2) - MH / 2;
      }
    }
  }

  pos[finalSlotId] = { x: finalX, y: finalY };

  // ----------------------------
  // CONNECTOR LINES
  // ----------------------------
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
      const mid = (fx + tx) / 2;

      connectors.push(
        <path
          key={`conn-${m.id}`}
          d={`M${fx},${fy} H${mid} V${ty} H${tx}`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    }

    if (m.side === "right") {
      const fx = from.x;
      const tx = to.x + MW;
      const mid = (fx + tx) / 2;

      connectors.push(
        <path
          key={`conn-${m.id}`}
          d={`M${fx},${fy} H${mid} V${ty} H${tx}`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    }
  });

  // ----------------------------
  // ROUND LABELS
  // ----------------------------
  const labels: JSX.Element[] = [];

  const roundNames = [
    "Round of 32",
    "Round of 16",
    "Quarterfinals",
    "Semifinals",
    "Final",
  ];

  for (let rIdx = 0; rIdx < sideRounds; rIdx++) {
    const round = rIdx + 1;
    const label = roundNames[rIdx] ?? `Round ${round}`;

    const lX = rIdx * (MW + RG) + MW / 2;
    const rX = totalW - rIdx * (MW + RG) - MW / 2;

    labels.push(
      <text
        key={`ll-${round}`}
        x={lX}
        y={RL - 8}
        textAnchor="middle"
        fontSize={11}
        fill="#6b7280"
        fontWeight={600}
      >
        {label}
      </text>
    );

    labels.push(
      <text
        key={`rl-${round}`}
        x={rX}
        y={RL - 8}
        textAnchor="middle"
        fontSize={11}
        fill="#6b7280"
        fontWeight={600}
      >
        {label}
      </text>
    );
  }

  labels.push(
    <text
      key="final-label"
      x={finalX + MW / 2}
      y={RL - 8}
      textAnchor="middle"
      fontSize={11}
      fill="#6b7280"
      fontWeight={600}
    >
      Final
    </text>
  );

  // ----------------------------
  // MATCH CARDS
  // ----------------------------
  const cards: JSX.Element[] = [];

  // Real matches
  matches.forEach((m) => {
    const p = pos[m.id];
    if (!p) return;

    const isCompleted = m.status === "completed";

    cards.push(
      <g key={m.id} onClick={() => onMatchClick(m)} style={{ cursor: "pointer" }}>
        <rect
          x={p.x + 2}
          y={p.y + 2}
          width={MW}
          height={MH}
          rx={6}
          fill="#00000015"
        />

        <rect
          x={p.x}
          y={p.y}
          width={MW}
          height={MH}
          rx={6}
          fill="#ffffff"
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        <line
          x1={p.x + 1}
          y1={p.y + MH / 2}
          x2={p.x + MW - 1}
          y2={p.y + MH / 2}
          stroke="#f3f4f6"
          strokeWidth={1}
        />

        <text
          x={p.x + 10}
          y={p.y + MH / 4 + 4}
          fontSize={11}
          fill="#1a1a1a"
          fontFamily="sans-serif"
        >
          {trunc(m.nameA, 22)}
        </text>

        <text
          x={p.x + 10}
          y={p.y + (MH * 3) / 4 + 4}
          fontSize={11}
          fill="#1a1a1a"
          fontFamily="sans-serif"
        >
          {trunc(m.nameB, 22)}
        </text>

        {isCompleted && (
          <circle
            cx={p.x + MW - 10}
            cy={p.y + MH / 2}
            r={4}
            fill="#22c55e"
          />
        )}
      </g>
    );
  });

  // Ghost/TBD matches
  const realIds = new Set(matches.map((m) => m.id));

  Object.entries(pos).forEach(([idStr, p]) => {
    const id = Number(idStr);

    if (realIds.has(id)) return;

    cards.push(
      <g key={`ghost-${id}`}>
        <rect
          x={p.x + 2}
          y={p.y + 2}
          width={MW}
          height={MH}
          rx={6}
          fill="#00000008"
        />

        <rect
          x={p.x}
          y={p.y}
          width={MW}
          height={MH}
          rx={6}
          fill="#fafafa"
          stroke="#d1d5db"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        <line
          x1={p.x + 1}
          y1={p.y + MH / 2}
          x2={p.x + MW - 1}
          y2={p.y + MH / 2}
          stroke="#f3f4f6"
          strokeWidth={1}
        />

        <text
          x={p.x + MW / 2}
          y={p.y + MH / 4 + 4}
          fontSize={10}
          fill="#cbd5e1"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          TBD
        </text>

        <text
          x={p.x + MW / 2}
          y={p.y + (MH * 3) / 4 + 4}
          fontSize={10}
          fill="#cbd5e1"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          TBD
        </text>
      </g>
    );
  });

  return (
    <div className="overflow-auto">
      <div className="inline-block rounded-2xl border border-gray-200 bg-white shadow-lg p-6">
        <svg width={totalW} height={totalH} style={{ display: "block" }}>
          {labels}
          {connectors}
          {cards}
        </svg>
      </div>
    </div>
  );
}

// ----------------------------
// PAGE
// ----------------------------
export default function TournamentBracketPage({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [totalRounds, setTotalRounds] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Get bracket for this tournament
        const { data: bracketRows, error: bracketError } = await supabase
          .from("bracket")
          .select("bracket_id")
          .eq("tournament_id", Number(tournamentId));

        if (bracketError || !bracketRows || !bracketRows.length) {
          setError("No bracket found for this tournament.");
          setLoading(false);
          return;
        }

        const bracketId = bracketRows[0].bracket_id;

        // 2. Get all bracket matches
        const { data: rawMatches, error: matchError } = await supabase
          .from("bracket_match")
          .select("*")
          .eq("bracket_id", bracketId);

        if (matchError || !rawMatches || !rawMatches.length) {
          setError("No matches found for this bracket.");
          setLoading(false);
          return;
        }

        // 3. Collect all tournamentsub_ids
        const subIds = [
          ...new Set(
            [
              ...rawMatches.map((m) => m.bmatch_submission_a),
              ...rawMatches.map((m) => m.bmatch_submission_b),
            ].filter(Boolean)
          ),
        ];

        // 4. Resolve submission → concept name
        const { data: subs } = await supabase
          .from("tournament_submission")
          .select("tournamentsub_id, concept(concept_title)")
          .in("tournamentsub_id", subIds);

        const nameMap: Record<string, string> = {};
        (subs ?? []).forEach((s: any) => {
          nameMap[s.tournamentsub_id] = s.concept?.concept_title ?? "TBD";
        });

        // 5. Sort by round then slot
        const sorted = [...rawMatches].sort((a, b) => {
          const ar = a.bmatch_index?.round ?? 1;
          const br = b.bmatch_index?.round ?? 1;
          const as = a.bmatch_index?.slot ?? 1;
          const bs = b.bmatch_index?.slot ?? 1;
          return ar !== br ? ar - br : as - bs;
        });

        // 6. Determine total rounds from round 1 match count
        const r1Count = sorted.filter((m) => (m.bmatch_index?.round ?? 1) === 1).length;
        const computedTotalRounds = Math.max(1, Math.round(Math.log2(r1Count * 2)));
        setTotalRounds(computedTotalRounds);

        // 7. Group by round
        const uniqueRounds = [
          ...new Set(sorted.map((m) => m.bmatch_index?.round ?? 1)),
        ].sort((a, b) => a - b);

        const byRound: Record<number, typeof sorted> = {};
        sorted.forEach((m) => {
          const r = m.bmatch_index?.round ?? 1;
          if (!byRound[r]) byRound[r] = [];
          byRound[r].push(m);
        });

        const r1Matches = byRound[1] ?? [];
        const r1Half = Math.ceil(r1Matches.length / 2);
        const finalRound = uniqueRounds.length > 1 ? uniqueRounds[uniqueRounds.length - 1] : null;

        // 8. Build BracketMatch[]
        const built: BracketMatch[] = sorted.map((m) => {
          const round = m.bmatch_index?.round ?? 1;
          const roundMatches = byRound[round] ?? [];
          const indexInRound = roundMatches.findIndex((x) => x.bmatch_id === m.bmatch_id);

          let side: "left" | "right" | "final" = "left";
          if (round === finalRound) {
            side = "final";
          } else if (round === 1) {
            side = indexInRound < r1Half ? "left" : "right";
          } else {
            side = indexInRound < roundMatches.length / 2 ? "left" : "right";
          }

          const nextRoundIdx = uniqueRounds.indexOf(round) + 1;
          const nextRound = uniqueRounds[nextRoundIdx];
          const nextRoundMatches = nextRound ? byRound[nextRound] : null;
          const nextMatch = nextRoundMatches?.[Math.floor(indexInRound / 2)] ?? null;

          return {
            id: m.bmatch_id,
            bmatchId: String(m.bmatch_id),
            roundNumber: round,
            slot: m.bmatch_index?.slot ?? 1,
            nameA: nameMap[m.bmatch_submission_a] ?? "TBD",
            nameB: nameMap[m.bmatch_submission_b] ?? "TBD",
            status: m.bmatch_status ?? "active",
            side,
            indexInRound,
            nextMatchId: nextMatch?.bmatch_id ?? null,
            tournamentSubAId: m.bmatch_submission_a ?? "",
            tournamentSubBId: m.bmatch_submission_b ?? "",
          };
        });

        setMatches(built);

        setMatches(built);
      } catch (err) {
        console.error(err);
        setError("Failed to load bracket.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tournamentId]);

  const handleMatchClick = (m: BracketMatch) => {
    router.push(`/tournament/${tournamentId}/tournamentbracket/${m.bmatchId}/onevsone`);
  };

  if (loading) return <div className="p-6 text-gray-500">Loading bracket...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!matches.length) return <div className="p-6 text-gray-400">No matches available.</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Tournament Bracket</h1>
      <BracketSVG
        matches={matches}
        totalRounds={totalRounds}
        onMatchClick={handleMatchClick}
      />
    </div>
  );
}