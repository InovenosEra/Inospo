// API-Football national-team IDs for every WC 2026 nation.
// Verified by lookup against /teams?country=<X> on 2026-05-07.
// Source of truth lives here; consumers should NOT hardcode these elsewhere.

export const WC_TEAM_API_ID: Record<string, number> = {
  Algeria: 1532,
  Argentina: 26,
  Australia: 20,
  Austria: 775,
  Belgium: 1,
  'Bosnia Herzegovina': 1113,
  Brazil: 6,
  Canada: 5529,
  'Cape Verde': 19128,
  Colombia: 8,
  'Congo DR': 1508,
  Croatia: 3,
  Curacao: 5530,
  Czechia: 770,
  Ecuador: 2382,
  Egypt: 32,
  England: 10,
  France: 2,
  Germany: 25,
  Ghana: 1504,
  Haiti: 2386,
  Iran: 22,
  Iraq: 1567,
  'Ivory Coast': 1501,
  Japan: 12,
  Jordan: 1548,
  Mexico: 16,
  Morocco: 31,
  Netherlands: 1118,
  'New Zealand': 4673,
  Norway: 1090,
  Panama: 11,
  Paraguay: 2380,
  Portugal: 27,
  Qatar: 1569,
  'Saudi Arabia': 23,
  Scotland: 1108,
  Senegal: 13,
  'South Africa': 1531,
  'South Korea': 17,
  Spain: 9,
  Sweden: 5,
  Switzerland: 15,
  Tunisia: 28,
  Turkey: 777,
  Uruguay: 7,
  USA: 2384,
  Uzbekistan: 1568,
};

export function getApiTeamId(name: string | undefined | null): number | null {
  if (!name) return null;
  return WC_TEAM_API_ID[name] ?? null;
}
