const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export type MatchStatus = "scheduled" | "live" | "finished";

export interface BracketTeam {
  name: string;
  abbr: string;
  logo?: string;
  score?: number;
  winner?: boolean;
}

export interface BracketMatch {
  id: string;
  home: BracketTeam;
  away: BracketTeam;
  date: string;
  status: MatchStatus;
  round: string;
}

export interface BracketRound {
  slug: string;
  matches: BracketMatch[];
}

export interface BracketData {
  rounds: BracketRound[];
  thirdPlace?: BracketMatch;
}

export const ROUND_ORDER = [
  "round-of-32",
  "round-of-16",
  "quarterfinals",
  "semifinals",
  "final",
];

async function fetchRange(dateRange: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${ESPN_BASE}?dates=${dateRange}&limit=100`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events ?? []) as unknown[];
  } catch {
    return [];
  }
}

export async function getBracketData(): Promise<BracketData> {
  // Fetch all knockout rounds in three parallel date-range queries
  const [r32Events, midEvents, lateEvents] = await Promise.all([
    fetchRange("20260628-20260703"), // R32
    fetchRange("20260704-20260712"), // R16 + QF
    fetchRange("20260713-20260720"), // SF + Final + 3rd
  ]);

  const allEvents = [...r32Events, ...midEvents, ...lateEvents];
  const roundMap = new Map<string, BracketMatch[]>();
  let thirdPlace: BracketMatch | undefined;

  for (const event of allEvents) {
    const e = event as Record<string, unknown>;
    const season = e.season as Record<string, unknown> | undefined;
    const slug = (season?.slug as string) ?? "";

    const isKnockout = ROUND_ORDER.includes(slug) || slug === "3rd-place-match";
    if (!isKnockout) continue;

    const competitions = e.competitions as Array<Record<string, unknown>> | undefined;
    const comp = competitions?.[0];
    if (!comp) continue;

    const competitors = (comp.competitors as Array<Record<string, unknown>>) ?? [];
    const home = competitors.find((c) => c.homeAway === "home") as Record<string, unknown> | undefined;
    const away = competitors.find((c) => c.homeAway === "away") as Record<string, unknown> | undefined;
    if (!home || !away) continue;

    const homeTeam = home.team as Record<string, unknown>;
    const awayTeam = away.team as Record<string, unknown>;

    const status = e.status as Record<string, unknown> | undefined;
    const statusType = status?.type as Record<string, unknown> | undefined;
    const statusName = (statusType?.name as string) ?? "";

    const finished =
      statusName === "STATUS_FULL_TIME" || statusName === "STATUS_FINAL";
    const live =
      !finished &&
      statusName !== "" &&
      statusName !== "STATUS_SCHEDULED";

    const hasScore = (finished || live) && home.score !== undefined && away.score !== undefined;
    const homeScore = hasScore ? parseInt(home.score as string, 10) : undefined;
    const awayScore = hasScore ? parseInt(away.score as string, 10) : undefined;

    const homeWins =
      finished &&
      homeScore !== undefined &&
      awayScore !== undefined &&
      homeScore > awayScore;
    const awayWins =
      finished &&
      homeScore !== undefined &&
      awayScore !== undefined &&
      awayScore > homeScore;

    const match: BracketMatch = {
      id: (e.id as string) ?? "",
      home: {
        name: (homeTeam.displayName as string) ?? "",
        abbr: (homeTeam.abbreviation as string) ?? "",
        logo: homeTeam.logo as string | undefined,
        score: homeScore !== undefined && !isNaN(homeScore) ? homeScore : undefined,
        winner: homeWins,
      },
      away: {
        name: (awayTeam.displayName as string) ?? "",
        abbr: (awayTeam.abbreviation as string) ?? "",
        logo: awayTeam.logo as string | undefined,
        score: awayScore !== undefined && !isNaN(awayScore) ? awayScore : undefined,
        winner: awayWins,
      },
      date: (e.date as string) ?? "",
      status: finished ? "finished" : live ? "live" : "scheduled",
      round: slug,
    };

    if (slug === "3rd-place-match") {
      thirdPlace = match;
    } else {
      if (!roundMap.has(slug)) roundMap.set(slug, []);
      roundMap.get(slug)!.push(match);
    }
  }

  // Sort matches within each round by date (preserves bracket slot ordering)
  for (const matches of roundMap.values()) {
    matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  const rounds: BracketRound[] = ROUND_ORDER.filter((slug) => roundMap.has(slug)).map(
    (slug) => ({
      slug,
      matches: roundMap.get(slug)!,
    })
  );

  return { rounds, thirdPlace };
}
