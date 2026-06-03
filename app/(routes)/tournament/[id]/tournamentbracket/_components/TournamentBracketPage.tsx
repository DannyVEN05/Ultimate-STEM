"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  formatCountdownParts,
  formatStatusLabel,
  getCountdownParts,
  getRoundCountdownTarget,
  getTournamentMilestoneTarget,
  resolveTournamentLifecycleStatus,
  TournamentLifecycleStatus,
} from "@/app/_utilities/tournamentLifecycle";

// ----------------------------
// CONSTANTS
// ----------------------------
const MW = 150;
const MH = 56;
const RG = 24;
const VG = 16;
const RL = 40;
const FG = 20;
const LABEL_FILL = "#dcfce7";
const LABEL_STROKE = "#34d399";
const LABEL_TEXT = "#065f46";
const CONNECTOR_STROKE = "#000000";

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
  coverA: string | null;
  coverB: string | null;
  descA: string | null;
  descB: string | null;
  deletedA: boolean;
  deletedB: boolean;
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

function getCoverUrl(bookCover: string | null | undefined): string {
  if (!bookCover) return "/covers/space.jpg";
  if (bookCover.startsWith("/")) return bookCover;
  return supabase.storage.from("book-covers").getPublicUrl(bookCover).data.publicUrl;
}

// ----------------------------
// TOOLTIP
// ----------------------------
function MatchTooltip({
  match,
  mouseX,
  mouseY,
  containerW,
  userVotes,
}: {
  match: BracketMatch;
  mouseX: number;
  mouseY: number;
  containerW: number;
  userVotes: Record<number, string>;
}) {
  const TOOLTIP_W = 360;
  const OFFSET = 16;

  // Flip left if tooltip would overflow right edge
  const left = mouseX + OFFSET + TOOLTIP_W > containerW
    ? mouseX - TOOLTIP_W - OFFSET
    : mouseX + OFFSET;

  const top = mouseY - 90;

  const votedSubId = userVotes[match.id];
  const votedA = votedSubId === match.tournamentSubAId;
  const votedB = votedSubId === match.tournamentSubBId;
  const hasVoted = !!votedSubId;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: TOOLTIP_W,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* Header */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>
          Match Preview
        </div>

        {/* Books */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {/* Book A */}
          <div style={{ flex: 1, display: "flex", gap: 8 }}>
            {match.deletedA ? (
              <div style={{
                width: 52, height: 70, borderRadius: 6, flexShrink: 0,
                background: "#f3f4f6", border: "2px dashed #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>📕</div>
            ) : (
              <img
                src={getCoverUrl(match.coverA)}
                alt={match.nameA}
                onError={(e) => { (e.target as HTMLImageElement).src = "/covers/space.jpg"; }}
                style={{ width: 52, height: 70, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3, marginBottom: 4 }}>
                {match.nameA || "TBD"}
              </div>
              {match.descA && (
                <div style={{
                  fontSize: 10, color: "#6b7280", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {match.descA}
                </div>
              )}
              {votedA && (
                <div style={{
                  display: "inline-block", fontSize: 9, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 4, background: "#dbeafe",
                  color: "#1e40af", marginTop: 6
                }}>
                  ✓ Voted
                </div>
              )}
            </div>
          </div>

          {/* VS */}
          <div style={{
            alignSelf: "center", flexShrink: 0,
            fontSize: 11, fontWeight: 800, color: "#7c3aed",
            background: "#f5f3ff", borderRadius: 20, padding: "4px 8px",
          }}>
            VS
          </div>

          {/* Book B */}
          <div style={{ flex: 1, display: "flex", gap: 8, flexDirection: "row-reverse" }}>
            {match.deletedB ? (
              <div style={{
                width: 52, height: 70, borderRadius: 6, flexShrink: 0,
                background: "#f3f4f6", border: "2px dashed #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>📕</div>
            ) : (
              <img
                src={getCoverUrl(match.coverB)}
                alt={match.nameB}
                onError={(e) => { (e.target as HTMLImageElement).src = "/covers/space.jpg"; }}
                style={{ width: 52, height: 70, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0, textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3, marginBottom: 4 }}>
                {match.nameB || "TBD"}
              </div>
              {match.descB && (
                <div style={{
                  fontSize: 10, color: "#6b7280", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {match.descB}
                </div>
              )}
              {votedB && (
                <div style={{
                  display: "inline-block", fontSize: 9, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 4, background: "#dbeafe",
                  color: "#1e40af", marginTop: 6
                }}>
                  ✓ Voted
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          {!hasVoted && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
              background: "#fee2e2", color: "#991b1b", letterSpacing: 0.5, textTransform: "uppercase"
            }}>
              ● Not Voted
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 12px", borderRadius: 20,
            background: match.status === "completed" ? "#dcfce7" : "#fef9c3",
            color: match.status === "completed" ? "#166534" : "#854d0e",
          }}>
            {match.status === "completed" ? "✓ Completed" : "● Active"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ----------------------------
// SVG BRACKET
// ----------------------------
function BracketSVG({
  matches,
  totalRounds,
  onMatchClick,
  resolvedStatus,
  activeRound,
  userVotes,
  bracketWinnerId,
}: {
  matches: BracketMatch[];
  totalRounds: number;
  onMatchClick: (m: BracketMatch) => void;
  resolvedStatus: TournamentLifecycleStatus;
  activeRound: number | null;
  userVotes: Record<number, string>;
  bracketWinnerId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMatch, setHoveredMatch] = useState<BracketMatch | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerW(containerRef.current.offsetWidth);
    }
  }, [matches]);

  if (!matches.length) return null;

  const r1Left = matches.filter((m) => m.roundNumber === 1 && m.side === "left");
  const r1Right = matches.filter((m) => m.roundNumber === 1 && m.side === "right");
  const r1Count = Math.max(r1Left.length, r1Right.length);

  const r1UnitH = MH + VG;
  const totalH = RL + r1Count * r1UnitH + 10;

  const sideRounds = totalRounds - 1;
  const sideWidth = sideRounds * (MW + RG);
  const finalX = sideWidth + FG;
  const totalW = finalX * 2 + MW - 10;

  const pos: Record<number, { x: number; y: number }> = {};

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

  // Final position — centred vertically
  const finalMatch = matches.find((m) => m.side === "final");
  const allNonFinal = matches.filter((m) => m.side !== "final");
  const matchYs = allNonFinal
    .map((m) => pos[m.id])
    .filter((p): p is { x: number; y: number } => Boolean(p))
    .map((p) => p.y);

  let finalY = totalH / 2 - MH / 2;
  if (matchYs.length > 0) {
    const topY = Math.min(...matchYs);
    const bottomY = Math.max(...matchYs) + MH;
    finalY = (topY + bottomY) / 2 - MH / 2;
  }

  const finalSlotId = finalMatch ? finalMatch.id : -9999;
  pos[finalSlotId] = { x: finalX, y: finalY };

  // Build a hit-test map: given mouse x/y in SVG coords, which match is it over?
  const matchHitAreas = matches.map((m) => ({ m, p: pos[m.id] })).filter(({ p }) => Boolean(p));

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;

    // Check if cursor is inside any match card
    const hit = matchHitAreas.find(({ p }) =>
      svgX >= p.x && svgX <= p.x + MW &&
      svgY >= p.y && svgY <= p.y + MH
    );

    if (hit) {
      setHoveredMatch(hit.m);
      // Mouse position relative to the container div
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setMousePos({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        });
      }
    } else {
      setHoveredMatch(null);
    }
  }, [matchHitAreas]);

  const handleSvgMouseLeave = useCallback(() => {
    setHoveredMatch(null);
  }, []);

  // ----------------------------
  // CONNECTORS
  // Draw proper bracket lines: for each pair of siblings, draw
  //   - a short horizontal stub from each card to a shared vertical spine
  //   - one vertical spine connecting both stubs
  //   - a horizontal line from the spine midpoint to the next round card
  // ----------------------------
  const connectors: JSX.Element[] = [];
  const STUB = 16; // length of horizontal stub from card edge to spine
  const STROKE = "#c4b5fd"; // subtle purple
  const SW = 1.5;

  // Group real matches by (side, round), pair them up, draw spines
  const roundGroups: Record<string, BracketMatch[]> = {};
  matches.forEach((m) => {
    if (m.side === "final") return;
    const key = `${m.side}-${m.roundNumber}`;
    if (!roundGroups[key]) roundGroups[key] = [];
    roundGroups[key].push(m);
  });

  // Also handle ghost slots — we need spines for them too
  // Build a combined slot list per (side, round) mixing real + ghost ids
  for (let rIdx = 0; rIdx < sideRounds; rIdx++) {
    const round = rIdx + 1;
    const slotsPerSide = Math.max(1, r1Count / Math.pow(2, rIdx));

    (["left", "right"] as const).forEach((side) => {
      const key = `${side}-${round}`;
      const realMs = (roundGroups[key] ?? []).sort((a, b) => a.indexInRound - b.indexInRound);

      // Get next round's matches on same side for target y
      const nextRound = round + 1;
      const nextKey = `${side}-${nextRound}`;
      const nextMs = (roundGroups[nextKey] ?? []).sort((a, b) => a.indexInRound - b.indexInRound);

      for (let i = 0; i < slotsPerSide; i += 2) {
        // Top and bottom of the pair
        const mTop = realMs[i];
        const mBot = realMs[i + 1];

        const topId = mTop ? mTop.id : -(round * 1000 + i * 2 + (side === "right" ? 1 : 0));
        const botId = mBot ? mBot.id : -(round * 1000 + (i + 1) * 2 + (side === "right" ? 1 : 0));

        const pTop = pos[topId];
        const pBot = pos[botId];
        if (!pTop || !pBot) continue;

        const yTop = pTop.y + MH / 2;
        const yBot = pBot.y + MH / 2;
        const yMid = (yTop + yBot) / 2;

        // Resolve next round target position from pos map
        // (works for real matches, ghost TBD slots, and the final)
        const pairIndex = Math.floor(i / 2);
        const nextRealMatch = nextMs[pairIndex];
        let pTarget: { x: number; y: number } | undefined;

        if (nextRealMatch) {
          pTarget = pos[nextRealMatch.id];
        } else if (round + 1 > sideRounds && finalMatch) {
          pTarget = pos[finalMatch.id];
        } else {
          const nr = round + 1;
          const ghostId = side === "left"
            ? -(nr * 1000 + pairIndex * 2)
            : -(nr * 1000 + pairIndex * 2 + 1);
          pTarget = pos[ghostId];
        }

        if (side === "left") {
          const stubX = pTop.x + MW + STUB;
          const targetX = pTarget ? pTarget.x : stubX;

          // Stub from top card
          connectors.push(
            <line key={`stub-top-${topId}`}
              x1={pTop.x + MW} y1={yTop} x2={stubX} y2={yTop}
              stroke={STROKE} strokeWidth={SW} />
          );
          // Stub from bottom card
          connectors.push(
            <line key={`stub-bot-${botId}`}
              x1={pBot.x + MW} y1={yBot} x2={stubX} y2={yBot}
              stroke={STROKE} strokeWidth={SW} />
          );
          // Vertical spine
          connectors.push(
            <line key={`spine-${topId}-${botId}`}
              x1={stubX} y1={yTop} x2={stubX} y2={yBot}
              stroke={STROKE} strokeWidth={SW} />
          );
          // Horizontal to next match
          if (pTarget) {
            connectors.push(
              <line key={`horiz-${topId}`}
                x1={stubX} y1={yMid} x2={targetX} y2={yMid}
                stroke={STROKE} strokeWidth={SW} />
            );
          }
        } else {
          const stubX = pTop.x - STUB; // vertical spine x (left of card)
          const targetX = pTarget ? pTarget.x + MW : stubX;

          // Stub from top card
          connectors.push(
            <line key={`stub-top-${topId}`}
              x1={pTop.x} y1={yTop} x2={stubX} y2={yTop}
              stroke={STROKE} strokeWidth={SW} />
          );
          // Stub from bottom card
          connectors.push(
            <line key={`stub-bot-${botId}`}
              x1={pBot.x} y1={yBot} x2={stubX} y2={yBot}
              stroke={STROKE} strokeWidth={SW} />
          );
          // Vertical spine
          connectors.push(
            <line key={`spine-${topId}-${botId}`}
              x1={stubX} y1={yTop} x2={stubX} y2={yBot}
              stroke={STROKE} strokeWidth={SW} />
          );
          // Horizontal to next match
          if (pTarget) {
            connectors.push(
              <line key={`horiz-${topId}`}
                x1={stubX} y1={yMid} x2={targetX} y2={yMid}
                stroke={STROKE} strokeWidth={SW} />
            );
          }
        }
      }
    });
  }

  // ----------------------------
  // ROUND LABELS
  // ----------------------------
  const labels: JSX.Element[] = [];

  const roundStatusColors = {
    finished: {
      fill: "#dcfce7",
      stroke: "#10b981",
      text: "#065f46"
    },
    active: {
      fill: "#fef9c3",
      stroke: "#eab308",
      text: "#713f12"
    },
    upcoming: {
      fill: "#f3f4f6",
      stroke: "#d1d5db",
      text: "#6b7280"
    }
  };

  const getRoundState = (rNum: number) => {
    if (resolvedStatus === "concluded" || resolvedStatus === "terminated") {
      return "finished";
    }
    if (resolvedStatus === "stage2") {
      if (!activeRound) return "upcoming";
      if (rNum < activeRound) return "finished";
      if (rNum === activeRound) return "active";
      return "upcoming";
    }
    return "upcoming";
  };

  for (let rIdx = 0; rIdx < sideRounds; rIdx++) {
    const roundNumber = rIdx + 1;
    const state = getRoundState(roundNumber);
    const colors = roundStatusColors[state];

    const label = `Round ${roundNumber}`;
    const lX = rIdx * (MW + RG) + MW / 2;
    const rX = totalW - rIdx * (MW + RG) - MW / 2;
    const badgeWidth = MW * 0.78;
    const badgeHeight = 28;
    const badgeY = 8;

    labels.push(
      <g key={`ll-${rIdx}`}>
        <rect x={lX - badgeWidth / 2} y={badgeY} width={badgeWidth} height={badgeHeight} rx={badgeHeight / 2}
          fill={colors.fill} stroke={colors.stroke} strokeWidth={1} />
        <text x={lX} y={badgeY + badgeHeight / 2 + 4} textAnchor="middle" fontSize={12} fill={colors.text} fontWeight={700}>
          {label}
        </text>
      </g>
    );
    labels.push(
      <g key={`rl-${rIdx}`}>
        <rect x={rX - badgeWidth / 2} y={badgeY} width={badgeWidth} height={badgeHeight} rx={badgeHeight / 2}
          fill={colors.fill} stroke={colors.stroke} strokeWidth={1} />
        <text x={rX} y={badgeY + badgeHeight / 2 + 4} textAnchor="middle" fontSize={12} fill={colors.text} fontWeight={700}>
          {label}
        </text>
      </g>
    );
  }

  const finalRoundNumber = sideRounds + 1;
  const finalState = getRoundState(finalRoundNumber);
  const finalColors = roundStatusColors[finalState];

  labels.push(
    <g key="final-label">
      <rect x={finalX + MW / 2 - 75} y={8} width={150} height={30} rx={15}
        fill={finalColors.fill} stroke={finalColors.stroke} strokeWidth={1} />
      <text x={finalX + MW / 2} y={8 + 30 / 2 + 4} textAnchor="middle" fontSize={13} fill={finalColors.text} fontWeight={700}>
        Round {finalRoundNumber}
      </text>
    </g>
  );

  // ----------------------------
  // MATCH CARDS
  // ----------------------------
  const cards: JSX.Element[] = [];
  const realIds = new Set(matches.map((m) => m.id));

  matches.forEach((m) => {
    const p = pos[m.id];
    if (!p) return;
    const isCompleted = m.status === "completed";
    const isHovered = hoveredMatch?.id === m.id;

    const hasVoted = !!userVotes[m.id];
    const dotColor = hasVoted ? "#3b82f6" : "#ef4444";

    let winnerSide: "a" | "b" | null = null;
    if (isCompleted) {
      if (m.side === "final") {
        if (bracketWinnerId === m.tournamentSubAId) winnerSide = "a";
        else if (bracketWinnerId === m.tournamentSubBId) winnerSide = "b";
      } else if (m.nextMatchId) {
        const nextMatch = matches.find((x) => x.id === m.nextMatchId);
        if (nextMatch) {
          if (nextMatch.tournamentSubAId === m.tournamentSubAId || nextMatch.tournamentSubBId === m.tournamentSubAId) {
            winnerSide = "a";
          } else if (nextMatch.tournamentSubAId === m.tournamentSubBId || nextMatch.tournamentSubBId === m.tournamentSubBId) {
            winnerSide = "b";
          }
        }
      }
    }

    const isWinnerA = winnerSide === "a";
    const isLoserA = winnerSide === "b";
    const isWinnerB = winnerSide === "b";
    const isLoserB = winnerSide === "a";

    cards.push(
      <g key={m.id} onClick={() => onMatchClick(m)} style={{ cursor: "pointer" }}>
        <rect x={p.x + 2} y={p.y + 2} width={MW} height={MH} rx={6} fill="#00000015" />
        <rect x={p.x} y={p.y} width={MW} height={MH} rx={6}
          fill={isHovered ? "#faf5ff" : "#ffffff"}
          stroke={isHovered ? "#7c3aed" : "#e5e7eb"}
          strokeWidth={isHovered ? 2 : 1} />
        <line x1={p.x + 1} y1={p.y + MH / 2} x2={p.x + MW - 1} y2={p.y + MH / 2} stroke="#f3f4f6" strokeWidth={1} />
        <text x={p.x + 10} y={p.y + MH / 4 + 4} fontSize={11}
          fill={m.deletedA ? "#9ca3af" : "#1a1a1a"}
          fontWeight={isWinnerA ? "bold" : "normal"}
          fontStyle={m.deletedA ? "italic" : "normal"}
          fontFamily="sans-serif">
          {m.deletedA ? "Unavailable" : trunc(m.nameA, 22)}
        </text>
        <text x={p.x + 10} y={p.y + (MH * 3) / 4 + 4} fontSize={11}
          fill={m.deletedB ? "#9ca3af" : "#1a1a1a"}
          fontWeight={isWinnerB ? "bold" : "normal"}
          fontStyle={m.deletedB ? "italic" : "normal"}
          fontFamily="sans-serif">
          {m.deletedB ? "Unavailable" : trunc(m.nameB, 22)}
        </text>
        <circle cx={p.x + MW - 10} cy={p.y + MH / 2} r={4} fill={dotColor} />
      </g>
    );
  });

  // Ghost TBD slots
  Object.entries(pos).forEach(([idStr, p]) => {
    const id = Number(idStr);
    if (realIds.has(id)) return;
    cards.push(
      <g key={`ghost-${id}`}>
        <rect x={p.x + 2} y={p.y + 2} width={MW} height={MH} rx={6} fill="#00000008" />
        <rect x={p.x} y={p.y} width={MW} height={MH} rx={6}
          fill="#fafafa" stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3" />
        <line x1={p.x + 1} y1={p.y + MH / 2} x2={p.x + MW - 1} y2={p.y + MH / 2} stroke="#f3f4f6" strokeWidth={1} />
        <text x={p.x + MW / 2} y={p.y + MH / 4 + 4} fontSize={10} fill="#cbd5e1" textAnchor="middle" fontFamily="sans-serif">TBD</text>
        <text x={p.x + MW / 2} y={p.y + (MH * 3) / 4 + 4} fontSize={10} fill="#cbd5e1" textAnchor="middle" fontFamily="sans-serif">TBD</text>
      </g>
    );
  });

  return (
    <div className="overflow-auto">
      <div
        ref={containerRef}
        className="inline-block rounded-2xl border border-gray-200 bg-white p-6"
        style={{ position: "relative" }}
      >
        <svg
          width={totalW}
          height={totalH}
          style={{ display: "block" }}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          {labels}
          {connectors}
          {cards}
        </svg>

        {hoveredMatch && (
          <MatchTooltip
            match={hoveredMatch}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
            containerW={containerW}
            userVotes={userVotes}
          />
        )}
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
  const [activeRound, setActiveRound] = useState(1);
  const [userVotes, setUserVotes] = useState<Record<number, string>>({});
  const [bracketWinnerId, setBracketWinnerId] = useState<string | null>(null);
  const [tournament, setTournament] = useState<{
    tournament_id: number;
    tournament_title: string;
    tournament_status: string;
    tournament_start_date: string;
    tournament_s2_start_date: string | null;
    tournament_end_date: string;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"stage2" | "round" | null>(null);
  const router = useRouter();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      try {
        await supabase.rpc("advance_tournament_lifecycle", { p_tournament_id: Number(tournamentId) });
      } catch (e) {
        console.warn("Lifecycle update check failed:", e);
      }

      const { data: tournamentRow, error: tournamentError } = await supabase
        .from("tournament")
        .select("tournament_id, tournament_title, tournament_status, tournament_start_date, tournament_s2_start_date, tournament_end_date")
        .eq("tournament_id", Number(tournamentId))
        .single();

      if (tournamentError) {
        setError("Unable to load tournament details.");
        return;
      }

      setTournament(tournamentRow);

      const { data: bracketRows, error: bracketError } = await supabase
        .from("bracket")
        .select("bracket_id, bracket_round_number, bracket_status, tournamentsub_id")
        .eq("tournament_id", Number(tournamentId));

      if (bracketError) {
        setError("Unable to load bracket for this tournament.");
        return;
      }

      // No bracket yet is a valid state (e.g. stage1 waiting for stage2). Treat as empty matches.
      if (!bracketRows || !bracketRows.length) {
        setMatches([]);
        setTotalRounds(1);
        setActiveRound(1);
        setBracketWinnerId(null);
        return;
      }

      const bracketIds = bracketRows.map((row) => row.bracket_id);
      const computedTotalRounds = Math.max(1, ...bracketRows.map((row) => row.bracket_round_number ?? 1));
      const computedActiveRound = bracketRows.find((row) => row.bracket_status === "active")?.bracket_round_number
        ?? computedTotalRounds;
      const winnerId = bracketRows.find((row) => row.tournamentsub_id)?.tournamentsub_id ?? null;

      setTotalRounds(computedTotalRounds);
      setActiveRound(computedActiveRound);
      setBracketWinnerId(winnerId);

      const { data: rawMatches, error: matchError } = await supabase
        .from("bracket_match")
        .select("*")
        .in("bracket_id", bracketIds);

      if (matchError) {
        setError("No matches found for this bracket.");
        return;
      }

      // If bracket exists but no matches have been created yet, treat as empty.
      if (!rawMatches || !rawMatches.length) {
        setMatches([]);
        setTotalRounds(1);
        setActiveRound(1);
        return;
      }

      const subIds = [
        ...new Set(
          [
            ...rawMatches.map((m) => m.bmatch_submission_a),
            ...rawMatches.map((m) => m.bmatch_submission_b),
          ].filter(Boolean)
        ),
      ];

      const { data: subs } = await supabase
        .from("tournament_submission")
        .select("tournamentsub_id, tournamentsub_status, concept(concept_title, concept_description, concept_styling, concept_status)")
        .in("tournamentsub_id", subIds);

      const nameMap: Record<string, string> = {};
      const coverMap: Record<string, string | null> = {};
      const descMap: Record<string, string | null> = {};
      const deletedSet = new Set<string>();

      (subs ?? []).forEach((s: any) => {
        const isSubDeleted = s.tournamentsub_status === 'deleted' || s.tournamentsub_status === 'terminated';
        const c = s.concept;
        const isConceptDeleted = !c || c.concept_status === 'deleted';

        if (isSubDeleted || isConceptDeleted) {
          deletedSet.add(s.tournamentsub_id);
          return;
        }
        nameMap[s.tournamentsub_id] = c.concept_title ?? "TBD";
        descMap[s.tournamentsub_id] = c.concept_description ?? null;
        coverMap[s.tournamentsub_id] = c.concept_styling?.book_cover ?? null;
      });

      const sorted = [...rawMatches].sort((a, b) => {
        const ar = a.bmatch_index?.round ?? 1;
        const br = b.bmatch_index?.round ?? 1;
        const as = a.bmatch_index?.slot ?? 1;
        const bs = b.bmatch_index?.slot ?? 1;
        return ar !== br ? ar - br : as - bs;
      });

      const r1Count = sorted.filter((m) => (m.bmatch_index?.round ?? 1) === 1).length;
      const computedSvgRounds = Math.max(1, Math.ceil(Math.log2(r1Count * 2)));
      setTotalRounds(computedSvgRounds);

      const byRound: Record<number, typeof sorted> = {};
      sorted.forEach((m) => {
        const r = m.bmatch_index?.round ?? 1;
        if (!byRound[r]) byRound[r] = [];
        byRound[r].push(m);
      });

      const r1Matches = byRound[1] ?? [];
      const r1Half = Math.ceil(r1Matches.length / 2);
      const finalRound = computedSvgRounds;

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

        const nextRound = round + 1;
        const nextRoundMatches = byRound[nextRound] ?? null;
        const nextMatch = nextRoundMatches?.[Math.floor(indexInRound / 2)] ?? null;

        return {
          id: m.bmatch_id,
          bmatchId: String(m.bmatch_id),
          roundNumber: round,
          slot: m.bmatch_index?.slot ?? 1,
          nameA: nameMap[m.bmatch_submission_a] ?? "TBD",
          nameB: nameMap[m.bmatch_submission_b] ?? "TBD",
          coverA: coverMap[m.bmatch_submission_a] ?? null,
          coverB: coverMap[m.bmatch_submission_b] ?? null,
          descA: descMap[m.bmatch_submission_a] ?? null,
          descB: descMap[m.bmatch_submission_b] ?? null,
          deletedA: deletedSet.has(m.bmatch_submission_a),
          deletedB: deletedSet.has(m.bmatch_submission_b),
          status: m.bmatch_status ?? "active",
          side,
          indexInRound,
          nextMatchId: nextMatch?.bmatch_id ?? null,
          tournamentSubAId: m.bmatch_submission_a ?? "",
          tournamentSubBId: m.bmatch_submission_b ?? "",
        };
      });

      setMatches(built);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: voteRows } = await supabase
          .from("vote")
          .select("bmatch_id, tournamentsub_id")
          .eq("user_id", user.id);

        if (voteRows) {
          const votesMap: Record<number, string> = {};
          voteRows.forEach((v) => {
            if (v.bmatch_id) {
              votesMap[v.bmatch_id] = v.tournamentsub_id;
            }
          });
          setUserVotes(votesMap);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load bracket.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
    // hydrate admin flag from user profile
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile, error } = await supabase
          .from("user")
          .select("user_role")
          .eq("user_id", user.id)
          .single();
        if (!error && profile && profile.user_role === "admin") setIsAdmin(true);
      } catch (e) {
        console.warn("admin check failed", e);
      }
    })();
  }, [load]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      load(true);
    }, 30000);

    return () => window.clearInterval(timerId);
  }, [load]);

  const resolvedStatus = tournament ? resolveTournamentLifecycleStatus(tournament, now) : "upcoming";
  const totalCountdown = getCountdownParts(tournament?.tournament_end_date ? new Date(tournament.tournament_end_date).getTime() : null, now);
  const milestone = getTournamentMilestoneTarget(tournament, resolvedStatus as TournamentLifecycleStatus, activeRound, totalRounds);
  const milestoneCountdown = getCountdownParts(milestone.targetMs, now);
  const roundCountdownTarget = getRoundCountdownTarget(tournament, totalRounds, activeRound);
  const roundCountdown = getCountdownParts(roundCountdownTarget, now);

  const handleMatchClick = (m: BracketMatch) => {
    router.push(`/tournament/${tournamentId}/tournamentbracket/${m.bmatchId}/onevsone`);
  };

  const openConfirm = (action: "stage2" | "round") => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const doAdvance = async () => {
    if (!tournament) return;
    setConfirmOpen(false);
    setLoading(true);
    try {
      if (confirmAction === "stage2") {
        // set stage2 start to now and seed
        const { error: upErr } = await supabase
          .from("tournament")
          .update({ tournament_s2_start_date: new Date().toISOString() })
          .eq("tournament_id", tournament.tournament_id);
        if (upErr) throw upErr;

        const { error: rpcErr } = await supabase.rpc("seed_tournament_brackets", { p_tournament_id: Number(tournament.tournament_id) });
        if (rpcErr) throw rpcErr;
      } else if (confirmAction === "round") {
        // finalize the active round
        const { error: rpcErr } = await supabase.rpc("finalize_bracket_round", {
          p_tournament_id: Number(tournament.tournament_id),
          p_round: Number(activeRound),
          p_force: true,
        });
        if (rpcErr) throw rpcErr;
      }

      // reschedule jobs and refresh state
      await supabase.rpc("reschedule_tournament_jobs", { p_tournament_id: Number(tournament.tournament_id) });
      await load(true);
    } catch (err: any) {
      console.error("Advance action failed", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading bracket...</div>;
  if (error) return <div className="p-6 text-red-500 relative">
    {error}
    <Button className="absolute left-0 top-20 bg-white hover:bg-slate-100 tracking-normal text-sm font-medium text-slate-700" onClick={() => { router.push("./") }}>
      ← Back to Tournament
    </Button>
  </div>;

  return (
    <div className="p-6">
      <h1 className="relative text-3xl font-bold tracking-tight text-center text-gray-900 mb-6">
        {tournament ? tournament.tournament_title : "Tournament Bracket"}
        <Button className="absolute left-0 bg-white hover:bg-slate-100 tracking-normal text-sm font-medium text-slate-700" onClick={() => { router.push("./") }}>
          ← Back to Tournament
        </Button>
      </h1>

      {tournament && (
        resolvedStatus === "concluded" || resolvedStatus === "terminated" ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-white to-emerald-50 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Tournament status</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#1d2436]">
                {formatStatusLabel(resolvedStatus, activeRound)}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              The tournament has finished
            </span>
          </div>
        ) : (
          <div className="mb-6 grid gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-white to-emerald-50 p-5 shadow-sm lg:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Live tournament status</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#1d2436]">
                {formatStatusLabel(resolvedStatus, activeRound)}
              </p>
              <p className="mt-1 text-sm text-[#6b7490]">Auto-refreshes every 30s</p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">Tournament ends in</p>
              <p className="mt-2 text-xl font-extrabold text-purple-900">{formatCountdownParts(totalCountdown)}</p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{milestone.label}</p>
              <p className="mt-2 text-xl font-extrabold text-emerald-900">{formatCountdownParts(milestoneCountdown)}</p>
              {isAdmin && (tournament.tournament_status === "stage1" || tournament.tournament_status === "stage2") && (
                <div className="mt-3 flex gap-2">
                  {tournament.tournament_status === "stage1" && (
                    <Button variant="outline" onClick={() => openConfirm("stage2")}>Advance to Stage 2 (seed now)</Button>
                  )}
                  {tournament.tournament_status === "stage2" && (
                    <Button variant="outline" onClick={() => openConfirm("round")}>Advance to Round {activeRound + 1}</Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      )}

      <BracketSVG
        matches={matches}
        totalRounds={totalRounds}
        onMatchClick={handleMatchClick}
        resolvedStatus={resolvedStatus}
        activeRound={activeRound}
        userVotes={userVotes}
        bracketWinnerId={bracketWinnerId}
      />
      {/* Confirmation modal for admin advance actions */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm advance</DialogTitle>
            <DialogDescription>
              {confirmAction === "stage2" && "This will set the Stage 2 start time to now, seed the bracket, and start round 1. Continue?"}
              {confirmAction === "round" && `This will finalize round ${activeRound} immediately and advance winners to round ${activeRound + 1}. Continue?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={doAdvance} disabled={loading}>Confirm</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}