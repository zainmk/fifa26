import type { PastMatch } from "@/types";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PastMatchCard({ match }: { match: PastMatch }) {
  const { homeTeam, awayTeam, score, venue, date } = match;

  return (
    <div
      className="grid items-center gap-4 sm:gap-6 bg-slate-800/30 border border-slate-700/20 rounded-2xl px-5 py-4 w-full opacity-75"
      style={{ gridTemplateColumns: "1fr 2fr 1fr" }}
    >
      {/* Left — date + venue */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400 font-medium">{formatDate(date)}</span>
        <span className="text-xs text-slate-500">{formatTime(date)}</span>
        {venue && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-700/40">
            <p className="text-xs text-slate-300 font-bold leading-tight">{venue.city}{venue.country ? `, ${venue.country}` : ""}</p>
            <p className="text-[11px] text-slate-600 leading-tight">{venue.stadium}</p>
          </div>
        )}
      </div>

      {/* Centre — teams + score */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm font-bold text-slate-400 truncate text-right flex-1">{homeTeam}</span>
        <span className="text-xl font-black text-slate-300 tabular-nums shrink-0">
          {score.home} <span className="text-slate-600 text-sm font-bold">-</span> {score.away}
        </span>
        <span className="text-sm font-bold text-slate-400 truncate flex-1">{awayTeam}</span>
      </div>

      {/* Right — FT badge */}
      <div className="flex justify-end">
        <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 border border-slate-700 text-[11px] font-black text-slate-500 uppercase tracking-widest">
          FT
        </span>
      </div>
    </div>
  );
}
