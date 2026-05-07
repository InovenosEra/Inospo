// @ts-nocheck — Deno runtime, not checked by Node TypeScript
//
// team-form: returns the last N official W/D/L results for a national team,
// fetched from API-Football and stripped of friendlies.
//
// Request body:
//   { team_id: number, last?: number }   // default last=5
//
// Response:
//   { team_id, form: ('W'|'D'|'L')[], fixtures: [...summary...] }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_BASE = "https://v3.football.api-sports.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// API-Football leagues to exclude — international friendlies + club friendlies.
//   10  = Friendlies International
//   667 = Friendlies Clubs
const FRIENDLY_LEAGUE_IDS = new Set<number>([10, 667]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("APIFOOTBALL_KEY");
    if (!apiKey) {
      return jsonResp({ error: "Missing APIFOOTBALL_KEY" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const teamId = Number(body.team_id);
    const want = Math.min(10, Math.max(1, Number(body.last ?? 5)));

    if (!teamId || Number.isNaN(teamId)) {
      return jsonResp({ error: "team_id required" }, 400);
    }

    // Pull the last 20 finished fixtures so we have headroom after filtering friendlies.
    const url = `${API_BASE}/fixtures?team=${teamId}&last=20`;
    const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
    if (!res.ok) {
      return jsonResp({ error: `API-Football ${res.status}`, details: await res.text() }, res.status);
    }
    const data = await res.json();
    const fixtures: any[] = data?.response ?? [];

    // Keep only finished, non-friendly competitive games.
    const competitive = fixtures.filter((f) => {
      const short = f?.fixture?.status?.short;
      const isFinished = short === "FT" || short === "AET" || short === "PEN";
      const leagueId = f?.league?.id;
      const leagueName = (f?.league?.name ?? "").toLowerCase();
      const isFriendly =
        FRIENDLY_LEAGUE_IDS.has(leagueId) ||
        leagueName.includes("friend");
      return isFinished && !isFriendly;
    });

    // Sort newest → oldest, take last N.
    competitive.sort((a, b) => {
      const ta = new Date(a?.fixture?.date ?? 0).getTime();
      const tb = new Date(b?.fixture?.date ?? 0).getTime();
      return tb - ta;
    });
    const slice = competitive.slice(0, want);

    const form: Array<"W" | "D" | "L"> = [];
    const summary: any[] = [];
    for (const f of slice) {
      const home = f?.teams?.home;
      const away = f?.teams?.away;
      const isHome = home?.id === teamId;
      const opp = isHome ? away : home;
      const homeWinner = home?.winner === true;
      const awayWinner = away?.winner === true;

      let result: "W" | "D" | "L" = "D";
      if (homeWinner && isHome) result = "W";
      else if (awayWinner && !isHome) result = "W";
      else if (homeWinner || awayWinner) result = "L";

      form.push(result);
      summary.push({
        date: f?.fixture?.date,
        opponent: opp?.name,
        league: f?.league?.name,
        score: `${f?.goals?.home ?? "?"}-${f?.goals?.away ?? "?"}`,
        result,
      });
    }

    // Reverse so the most recent is *last* in the array (matches existing UI convention).
    form.reverse();
    summary.reverse();

    return jsonResp({ team_id: teamId, form, fixtures: summary });
  } catch (e) {
    return jsonResp({ error: String(e) }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
