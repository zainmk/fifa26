import { getLiveMatches, getTodayMatches, filterFootball } from "@/lib/api";
import { getEnrichments, getPastMatches } from "@/lib/sofascore";
import { MatchCard } from "@/components/MatchCard";
import { PastMatchCard } from "@/components/PastMatchCard";
import { RefreshLive } from "@/components/RefreshLive";
import { ScrollToNow } from "@/components/ScrollToNow";

export const revalidate = 30;

export default async function HomePage() {
  const [liveAll, todayAll, past] = await Promise.all([
    getLiveMatches(),
    getTodayMatches(),
    getPastMatches(3),
  ]);

  const live = filterFootball(liveAll);
  const today = filterFootball(todayAll);
  const liveIds = new Set(live.map((m) => m.id));
  const upcoming = today
    .filter((m) => !liveIds.has(m.id))
    .sort((a, b) => a.date - b.date);

  const allMatches = [...live, ...upcoming];
  const enrichments = await getEnrichments(allMatches);

  return (
    <div className="min-h-screen bg-slate-900">
      <RefreshLive />

      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center gap-3">
          {/* FIFA World Cup trophy icon */}
          <svg className="w-6 h-6 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V17H7v2h10v-2h-4v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
          <h1 className="text-base font-black tracking-widest text-white uppercase">
            Welcome to <span className="text-amber-400">FIFA 26</span>
          </h1>
          <svg className="w-6 h-6 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V17H7v2h10v-2h-4v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        {past.length === 0 && allMatches.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-20">No matches found.</p>
        )}

        {past.map((m) => (
          <PastMatchCard key={m.id} match={m} />
        ))}

        {/* "Now" divider — sits between past and present/future */}
        {past.length > 0 && allMatches.length > 0 && (
          <>
            <ScrollToNow />
            <div id="now" className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-600" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Now</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-600" />
            </div>
          </>
        )}

        {allMatches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            isLive={liveIds.has(m.id)}
            enrichment={enrichments.get(m.id)}
          />
        ))}
      </main>

      <footer className="border-t border-slate-800 mt-16 py-6 text-center">
        <p className="text-slate-600 text-xs">Streams by streamed.pk · Scores by ESPN</p>
      </footer>
    </div>
  );
}
