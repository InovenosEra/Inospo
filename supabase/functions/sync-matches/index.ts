// @ts-nocheck — Deno runtime, not checked by Node TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'https://v3.football.api-sports.io';
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

// API-Football team name → our DB team name (where they differ)
const NAME_MAP: Record<string, string> = {
  'cape verde islands': 'cape verde',
  'curaçao': 'curacao',
  'united states': 'usa',
  'korea republic': 'south korea',
  'ir iran': 'iran',
  "côte d'ivoire": 'ivory coast',
  'bosnia and herzegovina': 'bosnia herzegovina',
  'czech republic': 'czechia',
  'türkiye': 'turkey',
  'congo dr': 'congo dr',
};

const mapStatus = (short: string): string => {
  if (['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
  return 'scheduled';
};

const mapStage = (round: string): string => {
  const r = round.toLowerCase();
  if (r.includes('group')) return 'group';
  if (r.includes('round of 32')) return 'round_of_32';
  if (r.includes('round of 16')) return 'round_of_16';
  if (r.includes('quarter')) return 'quarter_final';
  if (r.includes('semi')) return 'semi_final';
  if (r.includes('3rd') || r.includes('third')) return 'third_place';
  if (r.includes('final')) return 'final';
  return 'group';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('APIFOOTBALL_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing configuration: APIFOOTBALL_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all WC2026 fixtures from API-Football
    console.log('Fetching WC2026 fixtures from API-Football...');
    const res = await fetch(`${API_BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}`, {
      headers: { 'x-apisports-key': apiKey },
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(
        JSON.stringify({ error: `API-Football error: ${res.status}`, details: err }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const data = await res.json();
    const fixtures = data.response || [];
    console.log(`Got ${fixtures.length} fixtures from API-Football`);

    // 2. Fetch our existing matches — keyed by api_fixture_id (primary) and home|away pair (fallback)
    const { data: ourMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status, home_score, away_score, api_fixture_id');

    const byFixtureId = new Map<number, typeof ourMatches[0]>();
    const byTeamPair = new Map<string, typeof ourMatches[0]>();
    for (const m of ourMatches || []) {
      if (m.api_fixture_id) byFixtureId.set(m.api_fixture_id, m);
      byTeamPair.set(`${m.home_team_id}|${m.away_team_id}`, m);
    }

    // 3. Build team name → UUID map (needed only for knockout inserts)
    const { data: teams } = await supabase.from('teams').select('id, name');
    const nameToId = new Map<string, string>();
    for (const t of teams || []) {
      nameToId.set(t.name.toLowerCase().trim(), t.id);
    }
    const findTeamId = (name: string): string | undefined => {
      const norm = name.toLowerCase().trim();
      return nameToId.get(NAME_MAP[norm] || norm) ?? nameToId.get(norm);
    };

    // 4. Process each fixture
    let updated = 0, inserted = 0, skipped = 0;

    for (const f of fixtures) {
      const fixtureId: number = f.fixture.id;
      const status = mapStatus(f.fixture.status.short);
      const homeScore = f.goals.home ?? null;
      const awayScore = f.goals.away ?? null;
      const stage = mapStage(f.league.round);

      // Primary lookup: by api_fixture_id
      const existing = byFixtureId.get(fixtureId);

      if (existing) {
        // Update only if something changed
        if (
          existing.status !== status ||
          existing.home_score !== homeScore ||
          existing.away_score !== awayScore
        ) {
          const { error } = await supabase.from('matches')
            .update({ status, home_score: homeScore, away_score: awayScore, stage })
            .eq('id', existing.id);
          if (!error) updated++;
          else console.error(`Update error fixture ${fixtureId}:`, error.message);
        }
        continue;
      }

      // Fallback: name-based lookup (for knockout matches not yet in DB)
      const homeId = findTeamId(f.teams.home.name);
      const awayId = findTeamId(f.teams.away.name);

      if (!homeId || !awayId) {
        console.log(`Skipped (unknown team): ${f.teams.home.name} vs ${f.teams.away.name}`);
        skipped++;
        continue;
      }

      const pairMatch = byTeamPair.get(`${homeId}|${awayId}`);
      if (pairMatch) {
        // Found via pair — also store the fixture ID so future syncs use the fast path
        if (
          pairMatch.status !== status ||
          pairMatch.home_score !== homeScore ||
          pairMatch.away_score !== awayScore ||
          !pairMatch.api_fixture_id
        ) {
          const { error } = await supabase.from('matches')
            .update({ status, home_score: homeScore, away_score: awayScore, stage, api_fixture_id: fixtureId })
            .eq('id', pairMatch.id);
          if (!error) updated++;
          else console.error(`Update error (pair fallback) ${f.teams.home.name} vs ${f.teams.away.name}:`, error.message);
        }
        continue;
      }

      // Not in DB at all — insert (new knockout match with confirmed teams)
      const { error } = await supabase.from('matches').insert({
        home_team_id: homeId,
        away_team_id: awayId,
        match_date: f.fixture.date,
        stadium: f.fixture.venue?.name || null,
        city: f.fixture.venue?.city || null,
        stage,
        status,
        home_score: homeScore,
        away_score: awayScore,
        api_fixture_id: fixtureId,
      });
      if (!error) inserted++;
      else console.error(`Insert error ${f.teams.home.name} vs ${f.teams.away.name}:`, error.message);
    }

    console.log(`Sync done: ${updated} updated, ${inserted} inserted, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync complete: ${updated} updated, ${inserted} inserted, ${skipped} skipped`,
        updated,
        inserted,
        skipped,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
