"use client";

import { useState } from "react";
import { resolveAlias } from "@/lib/team-aliases";
import type { BracketData, BracketMatch, BracketTeam } from "@/lib/bracket";
import { ROUND_ORDER } from "@/lib/bracket";

// ── Normalization (mirrors lib/espn.ts teamKey) ───────────────────────────────
function normalizeKey(name: string): string {
  return resolveAlias(
    name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")
  );
}
function bracketTeamKey(home: string, away: string) {
  return `${normalizeKey(home)}_${normalizeKey(away)}`;
}

// ── Layout constants ──────────────────────────────────────────────────────────
const SLOT = 44;
const CARD_H = 34;
const COL_W = 140;
const CONN_W = 28;

function getMatchTop(globalRoundIdx: number, matchIdx: number): number {
  const slotsPerMatch = Math.pow(2, globalRoundIdx);
  return (matchIdx * slotsPerMatch + slotsPerMatch / 2) * SLOT - CARD_H / 2;
}

function getMatchCenter(globalRoundIdx: number, matchIdx: number): number {
  return getMatchTop(globalRoundIdx, matchIdx) + CARD_H / 2;
}

function neededHeight(globalRoundIdx: number, matchCount: number): number {
  if (matchCount === 0) return 200;
  return getMatchTop(globalRoundIdx, matchCount - 1) + CARD_H + 24;
}

function isTBD(name: string): boolean {
  return !name || name.toLowerCase().includes("winner") || name.toLowerCase().includes("loser");
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function BracketIcon({ active }: { active: boolean }) {
  const color = active ? "rgba(251,191,36,0.85)" : "rgba(251,191,36,0.4)";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s", flexShrink: 0 }}>
      <line x1="1"  y1="4"  x2="8"  y2="4"  />
      <line x1="1"  y1="10" x2="8"  y2="10" />
      <line x1="8"  y1="4"  x2="8"  y2="7"  />
      <line x1="8"  y1="10" x2="8"  y2="7"  />
      <line x1="8"  y1="7"  x2="14" y2="7"  />
      <line x1="1"  y1="14" x2="8"  y2="14" />
      <line x1="1"  y1="20" x2="8"  y2="20" />
      <line x1="8"  y1="14" x2="8"  y2="17" />
      <line x1="8"  y1="20" x2="8"  y2="17" />
      <line x1="8"  y1="17" x2="14" y2="17" />
      <line x1="14" y1="7"  x2="14" y2="12" />
      <line x1="14" y1="17" x2="14" y2="12" />
      <line x1="14" y1="12" x2="22" y2="12" />
    </svg>
  );
}

// ── Team row ──────────────────────────────────────────────────────────────────
function TeamRow({ team, showScore }: { team: BracketTeam; showScore: boolean }) {
  const tbd = isTBD(team.name);
  const rowH = (CARD_H - 2) / 2;
  return (
    <div style={{ height: rowH, display: "flex", alignItems: "center", gap: 4, padding: "0 6px" }}>
      {!tbd && team.logo ? (
        <img src={team.logo} alt={team.abbr} style={{ width: 12, height: 12, objectFit: "contain", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 12, height: 12, borderRadius: 2, background: tbd ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.15)", flexShrink: 0 }} />
      )}
      <span style={{
        flex: 1, fontSize: 9, fontWeight: tbd ? 500 : 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        color: tbd ? "rgba(255,255,255,0.18)" : team.winner ? "#ffffff" : "rgba(255,255,255,0.70)",
      }}>
        {tbd ? "TBD" : team.abbr || team.name}
      </span>
      {showScore && team.score !== undefined && (
        <span style={{ fontSize: 10, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: team.winner ? "#ffffff" : "rgba(255,255,255,0.45)", flexShrink: 0 }}>
          {team.score}
        </span>
      )}
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────
function MatchCard({ match, onClick }: { match: BracketMatch; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const showScore = match.status !== "scheduled";
  const isLive = match.status === "live";
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { if (onClick) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: COL_W, height: CARD_H,
        background: hovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
        border: isLive ? "1px solid rgba(239,68,68,0.4)"
          : hovered ? "1px solid rgba(255,255,255,0.22)"
          : "1px solid rgba(255,255,255,0.09)",
        borderRadius: 5, overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.1s, border-color 0.1s",
        boxShadow: isLive ? "0 0 10px rgba(239,68,68,0.15)" : "0 1px 4px rgba(0,0,0,0.4)",
      }}
    >
      <TeamRow team={match.home} showScore={showScore} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
      <TeamRow team={match.away} showScore={showScore} />
    </div>
  );
}

// ── Connector lines ───────────────────────────────────────────────────────────
function ConnectorColumn({ fromRoundIdx, toMatchCount, totalH }: { fromRoundIdx: number; toMatchCount: number; totalH: number }) {
  const lineColor = "rgba(255,255,255,0.11)";
  return (
    <div style={{ width: CONN_W, height: totalH, position: "relative", flexShrink: 0 }}>
      {Array.from({ length: toMatchCount }, (_, i) => {
        const topCenter = getMatchCenter(fromRoundIdx, 2 * i);
        const botCenter = getMatchCenter(fromRoundIdx, 2 * i + 1);
        const midY = (topCenter + botCenter) / 2;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: CONN_W / 2, top: topCenter, width: 1, height: botCenter - topCenter, background: lineColor }} />
            <div style={{ position: "absolute", left: 0, top: topCenter, width: CONN_W / 2, height: 1, background: lineColor }} />
            <div style={{ position: "absolute", left: 0, top: botCenter, width: CONN_W / 2, height: 1, background: lineColor }} />
            <div style={{ position: "absolute", left: CONN_W / 2, top: midY, width: CONN_W / 2, height: 1, background: lineColor }} />
          </div>
        );
      })}
    </div>
  );
}

// ── 3rd place card ────────────────────────────────────────────────────────────
function ThirdPlaceCard({ match, onClick }: { match: BracketMatch; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const showScore = match.status !== "scheduled";
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(251,191,36,0.45)", textAlign: "center", marginBottom: 6 }}>
        3rd Place
      </div>
      <div
        onClick={onClick}
        onMouseEnter={() => { if (onClick) setHovered(true); }}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: COL_W, height: CARD_H,
          background: hovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
          border: hovered ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 5, overflow: "hidden",
          cursor: onClick ? "pointer" : "default",
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        <TeamRow team={match.home} showScore={showScore} />
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
        <TeamRow team={match.away} showScore={showScore} />
      </div>
    </div>
  );
}

// ── Bracket card ──────────────────────────────────────────────────────────────
export function BracketPanel({
  data,
  matchKeyToId,
}: {
  data: BracketData;
  matchKeyToId: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function handleMatchClick(matchId: string) {
    setIsOpen(false);
    // Wait for the collapse animation (0.35s) to finish before scrolling,
    // otherwise scrollIntoView calculates position against the shrinking panel.
    setTimeout(() => {
      document.getElementById(`match-${matchId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.dispatchEvent(new CustomEvent("highlightMatch", { detail: { matchId } }));
    }, 370);
  }

  if (!data || data.rounds.length === 0) return null;

  const { rounds, thirdPlace } = data;

  const currentIdx = (() => {
    const i = rounds.findIndex((r) => r.matches.some((m) => m.status !== "finished"));
    return i === -1 ? rounds.length - 1 : i;
  })();

  const shownRounds = rounds.slice(currentIdx, Math.min(rounds.length, currentIdx + 2));
  const leftRound = shownRounds[0];
  const leftGlobalIdx = ROUND_ORDER.indexOf(leftRound.slug);
  const totalH = neededHeight(leftGlobalIdx, leftRound.matches.length);
  const showThirdPlace = shownRounds.some((r) => r.slug === "semifinals") && !!thirdPlace;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(180,130,20,0.03) 100%)",
        border: "1px solid rgba(251,191,36,0.22)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 0 0 1px rgba(251,191,36,0.06), 0 4px 24px rgba(251,191,36,0.08), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(251,191,36,0.15)",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    >
      {/* Collapsed trigger — always visible */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          userSelect: "none",
          background: isOpen ? "rgba(251,191,36,0.05)" : "transparent",
          transition: "background 0.2s",
        }}
      >
        <BracketIcon active={isOpen} />
      </div>

      {/* Expandable bracket content */}
      <div style={{
        overflow: "hidden",
        maxHeight: isOpen ? "900px" : "0px",
        transition: "max-height 0.35s ease",
      }}>
        <div style={{ borderTop: "1px solid rgba(251,191,36,0.12)", overflowX: "auto", display: "flex", justifyContent: "center", padding: "12px 20px 16px", background: "rgba(0,0,0,0.18)" }}>
          <div style={{ display: "inline-flex", alignItems: "flex-start" }}>
            {shownRounds.map((round, renderIdx) => {
              const globalIdx = ROUND_ORDER.indexOf(round.slug);
              const nextRound = shownRounds[renderIdx + 1];
              const showConnector = !!nextRound && nextRound.matches.length > 0;

              return (
                <div key={round.slug} style={{ display: "flex" }}>
                  <div style={{ width: COL_W, position: "relative", height: totalH, flexShrink: 0 }}>
                    {round.matches.map((match, matchIdx) => {
                      const linkedId = matchKeyToId[bracketTeamKey(match.home.name, match.away.name)];
                      return (
                        <div key={match.id} style={{ position: "absolute", top: getMatchTop(globalIdx, matchIdx), left: 0 }}>
                          <MatchCard
                            match={match}
                            onClick={linkedId ? () => handleMatchClick(linkedId) : undefined}
                          />
                        </div>
                      );
                    })}

                    {round.slug === "semifinals" && showThirdPlace && (
                      <div style={{ position: "absolute", top: totalH + 8, left: 0 }}>
                        <ThirdPlaceCard
                          match={thirdPlace!}
                          onClick={(() => {
                            const id = matchKeyToId[bracketTeamKey(thirdPlace!.home.name, thirdPlace!.away.name)];
                            return id ? () => handleMatchClick(id) : undefined;
                          })()}
                        />
                      </div>
                    )}
                  </div>

                  {showConnector && (
                    <ConnectorColumn fromRoundIdx={globalIdx} toMatchCount={nextRound.matches.length} totalH={totalH} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showThirdPlace && <div style={{ height: 64 }} />}
      </div>
    </div>
  );
}
