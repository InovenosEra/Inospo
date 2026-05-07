// @ts-nocheck — Deno runtime, not checked by Node TypeScript
//
// team-form: returns the last N official W/D/L results for one or many
// national teams, fetched from API-Football with friendlies stripped.
//
// Single-team request body:
//   { team_id: number, last?: number }   // default last=5
// Single response:
//   { team_id, form: ('W'|'D'|'L')[], fixtures: [...] }
//
// Bulk request body:
//   { team_ids: number[], last?: number }
// Bulk response:
//   { forms: { [team_id: number]: ('W'|'D'|'L')[] } }

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

async function getFormForTeam(
  teamId: number,
  want: number,
  apiKey: string,
): Promise<{ form: Array<"W" | "D" | "L">; summary: any[] }> {
  const url = `${API_BASE}/fixtures?team=${teamId}&last=20`;
  const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
  if (!res.ok) throw new Error(`API-Football ${res.status} for team ${teamId}`);
  const data = await res.json();
  const fixtures: any[] = data?.response ?? [];

  const competitive = fixtures.filter((f) => {
    const short = f?.fixture?.status?.short;
    const isFinished = short === "FT" || short === "AET" || short === "PEN";
    const leagueId = f?.league?.id;
    const leagueName = (f?.league?.name ?? "").toLowerCase();
    const isFriendly = FRIENDLY_LEAGUE_IDS.has(leagueId) || leagueName.includes("friend");
    return isFinished && !isFriendly;
  });

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
  form.reverse();
  summary.reverse();
  return { form, summary };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("APIFOOTBALL_KEY");
    if (!apiKey) return jsonResp({ error: "Missing APIFOOTBALL_KEY" }, 500);

    const body = await req.json().catch(() => ({}));
    const want = Math.min(10, Math.max(1, Number(body.last ?? 5)));

    // ── Bulk path ────────────────────────────────────────────────────────
    if (Array.isArray(body.team_ids) && body.team_ids.length > 0) {
      const ids: number[] = body.team_ids
        .map((x: unknown) => Number(x))
        .filter((n: number) => Number.isFinite(n) && n > 0);

      const results = await Promise.allSettled(
        ids.map((id) => getFormForTeam(id, want, apiKey)),
      );
      const forms: Record<number, Array<"W" | "D" | "L">> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") forms[ids[i]] = r.value.form;
      });
      return jsonResp({ forms });
    }

    // ── Single path (backwards compatible) ───────────────────────────────
    const teamId = Number(body.team_id);
    if (!teamId || Number.isNaN(teamId)) {
      return jsonResp({ error: "team_id or team_ids required" }, 400);
    }
    const { form, summary } = await getFormForTeam(teamId, want, apiKey);
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
