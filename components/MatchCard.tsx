"use client";

import { useRef, useState } from "react";
import type { Match, MatchEnrichment } from "@/types";
import { badgeUrl, embedUrl, usableSources } from "@/lib/api";

function TeamBadge({ badge, name }: { badge?: string; name?: string }) {
  if (!badge) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0">
        {name?.charAt(0) ?? "?"}
      </div>
    );
  }
  return (
    <img
      src={badgeUrl(badge)}
      alt={name ?? "Team"}
      width={40}
      height={40}
      className="w-10 h-10 object-contain shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function timeUntil(ms: number): string {
  const diff = ms - Date.now();
  if (diff <= 0) return "Starting now";
  const totalMins = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `in ${mins}m`;
  if (mins === 0) return `in ${hours}h`;
  return `in ${hours}h ${mins}m`;
}

export function MatchCard({
  match,
  isLive,
  enrichment,
}: {
  match: Match;
  isLive?: boolean;
  enrichment?: MatchEnrichment;
}) {
  const sources = usableSources(match.sources);
  const score = enrichment?.score;
  const venue = enrichment?.venue;

  const [showStreams, setShowStreams] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PRIORITY = ["delta", "echo", "golf"];
  const preferredSource =
    PRIORITY.map((p) => sources.find((s) => s.source.toLowerCase() === p)).find(Boolean) ??
    sources[0];

  function handleMouseEnter() {
    timerRef.current = setTimeout(() => setShowStreams(true), 500);
  }

  function handleMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowStreams(false);
  }

  function handleCardClick(e: React.MouseEvent) {
    // Don't double-open when clicking a stream badge directly
    if ((e.target as HTMLElement).closest("a")) return;
    if (preferredSource) {
      window.open(embedUrl(preferredSource.source, preferredSource.id), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="grid items-center gap-4 sm:gap-6 bg-slate-800/60 border border-slate-700/40 rounded-2xl px-5 py-4 w-full cursor-pointer"
      style={{ gridTemplateColumns: "1fr 2fr 1fr" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >

      {/* Time + venue — left column */}
      <div className="flex flex-col gap-0.5">
        {isLive ? (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">Live</span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-400">{timeUntil(match.date)}</span>
        )}
        <span className="text-xs text-slate-400 font-medium">{formatDate(match.date)}</span>
        <span className="text-xs text-slate-500">{formatTime(match.date)}</span>
        {venue && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-700/50">
            <p className="text-xs text-slate-300 font-bold leading-tight">{venue.city}{venue.country ? `, ${venue.country}` : ""}</p>
            <p className="text-[11px] text-slate-600 leading-tight">{venue.stadium}</p>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Home */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <span className="text-sm font-bold text-slate-200 truncate text-right">
            {match.teams?.home?.name ?? "Home"}
          </span>
          <TeamBadge badge={match.teams?.home?.badge} name={match.teams?.home?.name} />
        </div>

        {/* Score or VS */}
        <div className="shrink-0 w-16 flex items-center justify-center">
          {score !== undefined ? (
            <span className={`text-lg font-black tabular-nums ${isLive ? "text-white" : "text-slate-300"}`}>
              {score.home} <span className="text-slate-600 text-sm font-bold">-</span> {score.away}
            </span>
          ) : (
            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <TeamBadge badge={match.teams?.away?.badge} name={match.teams?.away?.name} />
          <span className="text-sm font-bold text-slate-200 truncate">
            {match.teams?.away?.name ?? "Away"}
          </span>
        </div>
      </div>

      {/* Stream buttons — revealed after 1s hover */}
      <div className={`flex flex-wrap gap-1.5 justify-end transition-opacity duration-200 ${showStreams ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {sources.length === 0 ? (
          <span className="text-[11px] text-slate-600">No streams</span>
        ) : (
          sources.map((s) => (
            <a
              key={`${s.source}-${s.id}`}
              href={embedUrl(s.source, s.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white text-[11px] font-bold uppercase tracking-wide transition-all duration-150"
            >
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {s.source}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
