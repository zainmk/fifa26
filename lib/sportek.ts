import { teamKey } from "@/lib/espn";

const BASE = "https://live2.totalsportekx.to";

// Convert a URL slug fragment to a display name for teamKey normalization.
// "Congo-DR" → "Congo DR", "Bosnia-and-Herzegovina" → "Bosnia and Herzegovina"
function slugToName(slug: string): string {
  return slug.replace(/-/g, " ");
}

async function fetchDayLinks(path: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return result;
    const html = await res.text();
    // Extract all full match URLs: href="https://live2.totalsportekx.to/{slug}/{id}"
    const re = /href="(https:\/\/live2\.totalsportekx\.to\/([^/"]+)\/\d+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const url = m[1];
      const slug = m[2];
      const vsIdx = slug.indexOf("-vs-");
      if (vsIdx < 1) continue;
      const home = slugToName(slug.substring(0, vsIdx));
      const away = slugToName(slug.substring(vsIdx + 4));
      const key = teamKey(home, away);
      if (!result.has(key)) result.set(key, url);
    }
  } catch { /* non-fatal — scraping failure shouldn't break the page */ }
  return result;
}

// Returns a map of teamKey → sportek match URL for today and tomorrow's matches.
export async function getSportekMatchUrls(): Promise<Map<string, string>> {
  const [today, tomorrow] = await Promise.all([
    fetchDayLinks("/date/today"),
    fetchDayLinks("/date/tomorrow"),
  ]);
  // today takes priority over tomorrow for the same key
  return new Map([...tomorrow, ...today]);
}
