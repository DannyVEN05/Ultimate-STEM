"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { JSX } from "react";

// ----------------------------
// CONSTANTS
// ----------------------------
const MW = 180; // match width
const MH = 56; // match height
const RG = 70; // round gap
const VG = 20; // vertical gap between matches
const RL = 36; // round label height
const FG = 50; // final gap from sides

// ----------------------------
// TYPES
// ----------------------------
interface BracketMatch {
  id: number | string;
  roundNumber: number;

  nameA: string;
  nameB: string;

  votesA: number;
  votesB: number;

  status: string;

  nextMatchId: number | string | null;

  side: "left" | "right" | "final";

  indexInRound: number;

  // NOTE:
  // These are tournament_submission IDs,
  // NOT concept_ids.
  tournamentSubAId: string;
  tournamentSubBId: string;
}

// ----------------------------
// FETCH BRACKET
// ----------------------------
async function fetchBracket(tournamentId: string) {
  const { data, error } = await supabase
    .from("bracket")
    .select("*")
    .eq("tournament_id", tournamentId)
    .single();

  if (error || !data) return null;

  return data;
}

// ----------------------------
// FETCH BRACKET MATCHES
// ----------------------------
async function fetchBracketMatches(bracketId: string) {
  const { data: matches, error } = await supabase
    .from("bracket_match")
    .select("*")
    .eq("bracket_id", bracketId);

  if (error || !matches) return [];

  const subIds = new Set<string>();

  matches.forEach((m: any) => {
    if (m.bmatch_concept_a)
      subIds.add(String(m.bmatch_concept_a));

    if (m.bmatch_concept_b)
      subIds.add(String(m.bmatch_concept_b));
  });

  if (subIds.size === 0) return matches;

  const { data: subs } = await supabase
    .from("tournament_submission")
    .select(`
      tournamentsub_id,
      concept (
        concept_id,
        concept_title
      )
    `)
    .in("tournamentsub_id", Array.from(subIds));

  const subMap: Record<string, any> = {};

  subs?.forEach((s: any) => {
    subMap[String(s.tournamentsub_id)] = s.concept;
  });

  return matches.map((m: any) => ({
    ...m,
    concept_a:
      subMap[String(m.bmatch_concept_a)] ?? null,

    concept_b:
      subMap[String(m.bmatch_concept_b)] ?? null,
  }));
}

// ----------------------------
// BUILD FROM BRACKET MATCHES
// ----------------------------
function buildFromBracket(raw: any[]): BracketMatch[] {
  const sorted = [...raw].sort((a, b) =>
    a.bmatch_round_number !== b.bmatch_round_number
      ? a.bmatch_round_number - b.bmatch_round_number
      : a.bmatch_id - b.bmatch_id
  );

  const rounds = [
    ...new Set(
      sorted.map((m) => m.bmatch_round_number)
    ),
  ].sort((a, b) => a - b);

  const finalRound =
    rounds[rounds.length - 1];

  const sideMap = new Map<
    number | string,
    "left" | "right" | "final"
  >();

  // ----------------------------
  // ROUND 1 SIDE ASSIGNMENT
  // ----------------------------
  const r1 = sorted.filter(
    (m) =>
      m.bmatch_round_number === rounds[0]
  );

  const half = Math.ceil(r1.length / 2);

  r1.forEach((m, i) => {
    sideMap.set(
      m.bmatch_id,
      i < half ? "left" : "right"
    );
  });

  // ----------------------------
  // PROPAGATE SIDES FORWARD
  // ----------------------------
  rounds.forEach((round, rIdx) => {
    if (round === finalRound) return;

    const currentRound = sorted.filter(
      (m) =>
        m.bmatch_round_number === round
    );

    const nextRound = sorted.filter(
      (m) =>
        m.bmatch_round_number ===
        rounds[rIdx + 1]
    );

    currentRound.forEach((match, idx) => {
      const nextIdx = Math.floor(idx / 2);

      const nextMatch =
        nextRound[nextIdx];

      if (!nextMatch) return;

      const currentSide =
        sideMap.get(match.bmatch_id) ??
        "left";

      if (
        !sideMap.has(nextMatch.bmatch_id)
      ) {
        sideMap.set(
          nextMatch.bmatch_id,
          currentSide
        );
      }
    });
  });

  // ----------------------------
  // BUILD MATCH OBJECTS
  // ----------------------------
  return sorted.map((match) => {
    const roundIdx = rounds.indexOf(
      match.bmatch_round_number
    );

    const currentRoundMatches =
      sorted.filter(
        (m) =>
          m.bmatch_round_number ===
          match.bmatch_round_number
      );

    const idxInRound =
      currentRoundMatches.findIndex(
        (m) =>
          m.bmatch_id ===
          match.bmatch_id
      );

    const nextRoundMatches =
      sorted.filter(
        (m) =>
          m.bmatch_round_number ===
          rounds[roundIdx + 1]
      );

    const nextMatch =
      nextRoundMatches.find(
        (_, i) =>
          i ===
          Math.floor(idxInRound / 2)
      ) ?? null;

    const side =
      match.bmatch_round_number ===
      finalRound
        ? "final"
        : sideMap.get(match.bmatch_id) ??
          "left";

    return {
      id: match.bmatch_id,

      roundNumber:
        match.bmatch_round_number,

      nameA:
        match.concept_a
          ?.concept_title ?? "TBD",

      nameB:
        match.concept_b
          ?.concept_title ?? "TBD",

      votesA:
        match.bmatch_concept_a_votes ??
        0,

      votesB:
        match.bmatch_concept_b_votes ??
        0,

      status:
        match.bmatch_status ??
        "scheduled",

      nextMatchId:
        nextMatch?.bmatch_id ?? null,

      side,

      indexInRound: idxInRound,

      tournamentSubAId: String(
        match.bmatch_concept_a ?? ""
      ),

      tournamentSubBId: String(
        match.bmatch_concept_b ?? ""
      ),
    };
  });
}

// ============================================================
// FALLBACK BRACKET BUILDER
// ============================================================
async function fetchSubmissions(
  tournamentId: string
) {
  const { data, error } = await supabase
    .from("tournament_submission")
    .select("*, concept(*)")
    .eq("tournament_id", tournamentId)
    .order("tournamentsub_likes", {
      ascending: false,
    });

  if (error || !data) return [];

  return data;
}

// ----------------------------
// SHUFFLE ARRAY
// ----------------------------
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

// ----------------------------
// SORT WITH RANDOM TIEBREAKS
// ----------------------------
function sortWithRandomTies(subs: any[]) {
  const grouped = new Map<number, any[]>();

  subs.forEach((s) => {
    const likes = s.tournamentsub_likes ?? 0;

    if (!grouped.has(likes)) {
      grouped.set(likes, []);
    }

    grouped.get(likes)!.push(s);
  });

  const sortedLikes = [...grouped.keys()].sort(
    (a, b) => b - a
  );

  const result: any[] = [];

  sortedLikes.forEach((likes) => {
    result.push(
      ...shuffleArray(grouped.get(likes)!)
    );
  });

  return result;
}

// ----------------------------
// STANDARD TOURNAMENT SEEDING
// Example for 8:
// [1,8,4,5,2,7,3,6]
// ----------------------------
function generateSeedOrder(size: number): number[] {
  let seeds = [1, 2];

  while (seeds.length < size) {
    const next: number[] = [];

    const sum = seeds.length * 2 + 1;

    seeds.forEach((seed) => {
      next.push(seed);
      next.push(sum - seed);
    });

    seeds = next;
  }

  return seeds;
}

function buildFromSubmissions(
  subs: any[]
): BracketMatch[] {
  if (subs.length < 2) return [];

  // ----------------------------
  // SORT BY LIKES
  // RANDOMISE TIES
  // ----------------------------
  const seeded = sortWithRandomTies(subs);

  // ----------------------------
  // POWER OF TWO
  // ----------------------------
  const size = Math.pow(
    2,
    Math.ceil(Math.log2(seeded.length))
  );

  const totalRounds = Math.log2(size);

  // ----------------------------
  // PAD WITH BYES
  // ----------------------------
  while (seeded.length < size) {
    seeded.push(null);
  }

  // ----------------------------
  // TRUE TOURNAMENT SEED ORDER
  // ----------------------------
  const seedOrder = generateSeedOrder(size);

  // ----------------------------
  // APPLY SEED ORDER
  // ----------------------------
  const padded = seedOrder.map(
    (seed) => seeded[seed - 1] ?? null
  );

  let matchId = 1;

  const roundIds: number[][] = [];

  let count = size / 2;

  for (let r = 0; r < totalRounds; r++) {
    roundIds.push(
      Array.from(
        { length: count },
        (_, i) => matchId + i
      )
    );

    matchId += count;

    count = Math.floor(count / 2);
  }

  const matches: BracketMatch[] = [];

  const finalRound = totalRounds - 1;

  const r1Count = roundIds[0].length;

  const half = Math.ceil(r1Count / 2);

  for (let r = 0; r < totalRounds; r++) {
    roundIds[r].forEach((id, i) => {
      const nextMatchId =
        roundIds[r + 1]?.[
          Math.floor(i / 2)
        ] ?? null;

      const teamA =
        r === 0 ? padded[i * 2] : null;

      const teamB =
        r === 0
          ? padded[i * 2 + 1]
          : null;

      let side:
        | "left"
        | "right"
        | "final" = "left";

      if (r === finalRound)
        side = "final";
      else if (r === 0)
        side =
          i < half ? "left" : "right";
      else
        side =
          i <
          Math.ceil(
            roundIds[r].length / 2
          )
            ? "left"
            : "right";

      matches.push({
        id,

        roundNumber: r + 1,

        nameA:
          teamA?.concept
            ?.concept_title ?? "TBD",

        nameB:
          teamB?.concept
            ?.concept_title ?? "TBD",

        votesA: 0,
        votesB: 0,

        status: "scheduled",

        nextMatchId,

        side,

        indexInRound: i,

        tournamentSubAId: teamA
          ? String(teamA.tournamentsub_id)
          : "",

        tournamentSubBId: teamB
          ? String(teamB.tournamentsub_id)
          : "",
      });
    });
  }

  return matches;
}

// ----------------------------
// HELPERS
// ----------------------------
function trunc(
  s: string | null | undefined,
  n: number
) {
  if (!s) return "TBD";

  return s.length <= n
    ? s
    : s.slice(0, n - 1) + "…";
}

// ----------------------------
// SVG BRACKET RENDERER
// ----------------------------
function BracketSVG({
  matches,
  onMatchClick,
}: {
  matches: BracketMatch[];

  onMatchClick: (
    m: BracketMatch
  ) => void;
}) {
  if (!matches.length) return null;

  const rounds = [
    ...new Set(
      matches.map((m) => m.roundNumber)
    ),
  ].sort((a, b) => a - b);

  const finalRound =
    rounds[rounds.length - 1];

  const nonFinal = rounds.filter(
    (r) => r !== finalRound
  );

  const leftR1 = matches.filter(
    (m) =>
      m.roundNumber === rounds[0] &&
      m.side === "left"
  );

  const rightR1 = matches.filter(
    (m) =>
      m.roundNumber === rounds[0] &&
      m.side === "right"
  );

  const sideWidth =
    nonFinal.length * (MW + RG);

  const finalX = sideWidth + FG;

  const totalW =
    finalX * 2 + MW;

  const totalH =
    RL +
    Math.max(
      leftR1.length,
      rightR1.length
    ) *
      (MH + VG) *
      1.5 +
    120;

  // ----------------------------
  // POSITIONS
  // ----------------------------
  const pos: Record<
    string | number,
    { x: number; y: number }
  > = {};

  nonFinal.forEach((round, rIdx) => {
    const leftMs = matches.filter(
      (m) =>
        m.roundNumber === round &&
        m.side === "left"
    );

    const rightMs = matches.filter(
      (m) =>
        m.roundNumber === round &&
        m.side === "right"
    );

    const lSpacing =
      ((totalH - RL) /
        Math.max(leftR1.length, 1)) *
      Math.pow(2, rIdx);

    const rSpacing =
      ((totalH - RL) /
        Math.max(rightR1.length, 1)) *
      Math.pow(2, rIdx);

    const lX =
      rIdx * (MW + RG);

    const rX =
      totalW -
      MW -
      rIdx * (MW + RG);

    leftMs.forEach((m, i) => {
      pos[m.id] = {
        x: lX,
        y:
          RL +
          i * lSpacing +
          lSpacing / 2 -
          MH / 2,
      };
    });

    rightMs.forEach((m, i) => {
      pos[m.id] = {
        x: rX,
        y:
          RL +
          i * rSpacing +
          rSpacing / 2 -
          MH / 2,
      };
    });
  });

  const finalMatch = matches.find(
    (m) => m.side === "final"
  );

  if (finalMatch) {
    pos[finalMatch.id] = {
      x: finalX,
      y: totalH / 2 - MH / 2,
    };
  }

  // ----------------------------
  // CONNECTORS
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

      const mx =
        fx + (tx - fx) / 2;

      connectors.push(
        <path
          key={`c-${m.id}-${m.nextMatchId}`}
          d={`M${fx} ${fy} H${mx} V${ty} H${tx}`}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={1.5}
        />
      );
    } else if (m.side === "right") {
      const fx = from.x;

      const tx = to.x + MW;

      const mx =
        fx - (fx - tx) / 2;

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

  // ----------------------------
  // LABELS
  // ----------------------------
  const labels: JSX.Element[] = [];

  nonFinal.forEach((round, rIdx) => {
    const lX =
      rIdx * (MW + RG);

    const rX =
      totalW -
      MW -
      rIdx * (MW + RG);

    [lX, rX].forEach((x, si) => {
      labels.push(
        <text
          key={`lbl-${round}-${si}`}
          x={x + MW / 2}
          y={RL - 10}
          textAnchor="middle"
          fontSize={11}
          fontFamily="sans-serif"
          fill="#aaa"
        >
          Round {round}
        </text>
      );
    });
  });

  if (finalMatch) {
    labels.push(
      <text
        key="lbl-final"
        x={
          pos[finalMatch.id].x +
          MW / 2
        }
        y={RL - 10}
        textAnchor="middle"
        fontSize={11}
        fontFamily="sans-serif"
        fill="#aaa"
        fontWeight={600}
      >
        Final
      </text>
    );
  }

  // ----------------------------
  // MATCH CARDS
  // ----------------------------
  const cards: JSX.Element[] = [];

  matches.forEach((m) => {
    const p = pos[m.id];

    if (!p) return;

    const done =
      m.status === "done";

    const showVotes =
      done &&
      (m.votesA > 0 ||
        m.votesB > 0);

    const aWins =
      done && m.votesA > m.votesB;

    const bWins =
      done && m.votesB > m.votesA;

    cards.push(
      <g
        key={`m-${m.id}`}
        onClick={() => {
          if (
            m.tournamentSubAId &&
            m.tournamentSubBId
          ) {
            onMatchClick(m);
          }
        }}
        style={{
          cursor:
            m.tournamentSubAId &&
            m.tournamentSubBId
              ? "pointer"
              : "default",
        }}
      >
        {/* Card */}
        <rect
          x={p.x}
          y={p.y}
          width={MW}
          height={MH}
          rx={6}
          fill="#fff"
          stroke="#e0e0e0"
          strokeWidth={1}
          filter="url(#sh)"
        />

        <line
          x1={p.x}
          y1={p.y + MH / 2}
          x2={p.x + MW}
          y2={p.y + MH / 2}
          stroke="#e0e0e0"
          strokeWidth={1}
        />

        {/* Winner highlights */}
        {aWins && (
          <rect
            x={p.x + 1}
            y={p.y + 1}
            width={MW - 2}
            height={MH / 2 - 1}
            rx={5}
            fill="#f0fff4"
          />
        )}

        {bWins && (
          <rect
            x={p.x + 1}
            y={p.y + MH / 2}
            width={MW - 2}
            height={MH / 2 - 1}
            rx={5}
            fill="#f0fff4"
          />
        )}

        {/* Name A */}
        <text
          x={p.x + 10}
          y={p.y + MH / 4 + 4}
          fontSize={11}
          fontFamily="sans-serif"
          fill={
            aWins
              ? "#16a34a"
              : m.nameA === "TBD"
              ? "#bbb"
              : "#1a1a1a"
          }
          fontWeight={
            aWins ? 700 : 400
          }
        >
          {trunc(m.nameA, 20)}
        </text>

        {/* Votes A */}
        {showVotes && (
          <text
            x={p.x + MW - 8}
            y={p.y + MH / 4 + 4}
            fontSize={11}
            fontFamily="sans-serif"
            fill={
              aWins
                ? "#22c55e"
                : "#ef4444"
            }
            fontWeight={700}
            textAnchor="end"
          >
            {m.votesA}
          </text>
        )}

        {/* Name B */}
        <text
          x={p.x + 10}
          y={
            p.y +
            (MH * 3) / 4 +
            4
          }
          fontSize={11}
          fontFamily="sans-serif"
          fill={
            bWins
              ? "#16a34a"
              : m.nameB === "TBD"
              ? "#bbb"
              : "#1a1a1a"
          }
          fontWeight={
            bWins ? 700 : 400
          }
        >
          {trunc(m.nameB, 20)}
        </text>

        {/* Votes B */}
        {showVotes && (
          <text
            x={p.x + MW - 8}
            y={
              p.y +
              (MH * 3) / 4 +
              4
            }
            fontSize={11}
            fontFamily="sans-serif"
            fill={
              bWins
                ? "#22c55e"
                : "#ef4444"
            }
            fontWeight={700}
            textAnchor="end"
          >
            {m.votesB}
          </text>
        )}

        {/* Hover overlay */}
        <rect
          x={p.x}
          y={p.y}
          width={MW}
          height={MH}
          rx={6}
          fill="transparent"
          className="mhover"
        />
      </g>
    );
  });

  return (
    <div
      style={{
        overflowX: "auto",
        width: "100%",
      }}
    >
      <svg
        width={totalW}
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        style={{
          display: "block",
          minWidth: totalW,
        }}
      >
        <defs>
          <filter
            id="sh"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
          >
            <feDropShadow
              dx={0}
              dy={1}
              stdDeviation={1.5}
              floodColor="rgba(0,0,0,0.08)"
            />
          </filter>
        </defs>

        {connectors}
        {labels}
        {cards}
      </svg>

      <style>{`
        .mhover:hover {
          fill: rgba(0,0,0,0.03) !important;
        }
      `}</style>
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
  const [matches, setMatches] =
    useState<BracketMatch[]>([]);

  const [usingFallback, setUsingFallback] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);

      // ----------------------------
      // PRIMARY PATH
      // ----------------------------
      const bracket =
        await fetchBracket(
          tournamentId
        );

      if (bracket) {
        const raw =
          await fetchBracketMatches(
            bracket.bracket_id
          );

        if (raw.length > 0) {
          setMatches(
            buildFromBracket(raw)
          );

          setUsingFallback(false);

          setLoading(false);

          return;
        }
      }

      // ----------------------------
      // FALLBACK PATH
      // ----------------------------
      console.warn(
        "No bracket data — falling back to submission preview."
      );

      const subs =
        await fetchSubmissions(
          tournamentId
        );

      setMatches(
        buildFromSubmissions(subs)
      );

      setUsingFallback(true);

      setLoading(false);
    }

    load();
  }, [tournamentId]);

  const handleMatchClick = (
    m: BracketMatch
  ) => {
    if (
      !m.tournamentSubAId ||
      !m.tournamentSubBId
    ) {
      return;
    }

    router.push(
      `./onevsone?subA=${m.tournamentSubAId}&subB=${m.tournamentSubBId}`
    );
  };

  if (loading) {
    return (
      <div>
        Loading bracket...
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div>
        No bracket to be displayed
        right now.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        background: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#1a1a1a",
          marginBottom: "8px",
        }}
      >
        Tournament Bracket
      </h1>

      {usingFallback && (
        <p
          style={{
            color: "#999",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          No bracket created yet —
          showing preview based on
          current submissions.
        </p>
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow:
            "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <BracketSVG
          matches={matches}
          onMatchClick={
            handleMatchClick
          }
        />
      </div>
    </div>
  );
}