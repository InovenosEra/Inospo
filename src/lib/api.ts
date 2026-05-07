import { supabase } from './supabase';
import { getApiTeamId } from './teamIds';
import type {
  Match,
  Team,
  Prediction,
  League,
  NewsArticle,
  TopScorer,
  LeaderboardEntry,
} from '@/types';

export type FormResult = 'W' | 'D' | 'L';

// ─── football-api edge function (POST with action in body) ────────────────────
async function callFootballApi(action: string, params?: Record<string, string>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('football-api', {
    body: { action, ...params },
  });
  if (error) throw error;
  return data;
}

// ─── Team form (last 5 official, no friendlies) ───────────────────────────────
// Returns W/D/L results in chronological order (oldest first, most-recent last).
// Returns [] only when the team isn't in the WC_TEAM_API_ID map. Network/API
// failures THROW so React Query's retry can do its job — a swallowed error
// would cache [] permanently and hide the chips with no recovery path.
export async function fetchTeamForm(teamName: string): Promise<FormResult[]> {
  const teamId = getApiTeamId(teamName);
  if (!teamId) return [];
  const { data, error } = await supabase.functions.invoke('team-form', {
    body: { team_id: teamId, last: 5 },
  });
  if (error) throw error;
  return (data?.form ?? []) as FormResult[];
}

// ─── Matches ───────────────────────────────────────────────────────────────────

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .order('match_date', { ascending: true });

  if (error) throw error;
  return data as Match[];
}

export async function fetchMatchById(id: string): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Match;
}

// ─── Teams ─────────────────────────────────────────────────────────────────────

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('group_name', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Team[];
}

export async function fetchTeamById(id: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Team;
}

// ─── Predictions ───────────────────────────────────────────────────────────────

export async function fetchUserPredictions(userId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      match:matches(
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Prediction[];
}

export async function upsertPrediction(
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<Prediction> {
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as Prediction;
}

export async function fetchPredictionForMatch(
  userId: string,
  matchId: string
): Promise<Prediction | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) throw error;
  return data as Prediction | null;
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data || []).map((profile, index) => ({
    rank: index + 1,
    profile,
    total_points: profile.total_points ?? 0,
    correct_predictions: 0,
  })) as LeaderboardEntry[];
}

// ─── Leagues ───────────────────────────────────────────────────────────────────

export async function fetchUserLeagues(userId: string): Promise<League[]> {
  const { data, error } = await supabase
    .from('league_members')
    .select('league:leagues(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((row: any) => row.league).filter(Boolean) as League[];
}

export async function fetchGlobalLeague(): Promise<League | null> {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('is_global', true)
    .maybeSingle();

  if (error) return null;
  return data as League | null;
}

export async function createLeague(name: string, ownerId: string): Promise<League> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data, error } = await supabase
    .from('leagues')
    .insert({ name, code, owner_id: ownerId, is_global: false })
    .select()
    .single();

  if (error) throw error;
  return data as League;
}

export async function joinLeague(code: string, userId: string): Promise<void> {
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id')
    .eq('code', code.toUpperCase())
    .single();

  if (leagueError) throw new Error('League not found');

  const { error } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: userId });

  if (error) throw error;
}

// ─── Edge Functions ────────────────────────────────────────────────────────────

// News: POST with { teamQuery }
export async function fetchNews(teamQuery?: string): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-news', {
      body: { teamQuery },
    });
    if (error) throw error;
    return (data?.articles || []) as NewsArticle[];
  } catch {
    return [];
  }
}

// Match Fact: POST with { homeTeam, awayTeam, stadium, city, stage }
export async function fetchMatchFact(match: Match): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('match-fact', {
      body: {
        homeTeam: match.home_team?.name,
        awayTeam: match.away_team?.name,
        stadium: match.stadium,
        city: match.city,
        stage: match.stage,
      },
    });
    if (error) throw error;
    return data?.fact || '';
  } catch {
    return '';
  }
}

// Top Scorers: GET via football-api (API-Football format)
export async function fetchTopScorers(): Promise<TopScorer[]> {
  try {
    const data = await callFootballApi('topscorers');
    return (data?.response || []).slice(0, 15).map((item: any) => ({
      player_id: item.player?.id,
      player_name: item.player?.name || 'Unknown',
      team_name: item.statistics?.[0]?.team?.name || '',
      team_code: item.statistics?.[0]?.team?.name?.slice(0, 3).toUpperCase() || '',
      goals: item.statistics?.[0]?.goals?.total || 0,
      assists: item.statistics?.[0]?.goals?.assists || 0,
      image_path: item.player?.photo,
    })) as TopScorer[];
  } catch {
    return [];
  }
}

// Top Assists: GET via football-api (API-Football format)
export async function fetchTopAssists(): Promise<TopScorer[]> {
  try {
    const data = await callFootballApi('topassists');
    return (data?.response || []).slice(0, 15).map((item: any) => ({
      player_id: item.player?.id,
      player_name: item.player?.name || 'Unknown',
      team_name: item.statistics?.[0]?.team?.name || '',
      team_code: item.statistics?.[0]?.team?.name?.slice(0, 3).toUpperCase() || '',
      goals: 0,
      assists: item.statistics?.[0]?.goals?.assists || 0,
      image_path: item.player?.photo,
    })) as TopScorer[];
  } catch {
    return [];
  }
}

// Live Fixtures: GET via football-api (API-Football format)
export async function fetchLiveFixtures() {
  try {
    const data = await callFootballApi('live');
    return data?.response || [];
  } catch {
    return [];
  }
}

// Match Statistics: GET via football-api
export async function fetchMatchStatistics(fixtureId: string) {
  try {
    const data = await callFootballApi('statistics', { fixtureId });
    return (data?.response || []) as any[];
  } catch {
    return [];
  }
}

// Match Events: GET via football-api
export async function fetchMatchEvents(fixtureId: string) {
  try {
    const data = await callFootballApi('events', { fixtureId });
    return (data?.response || []) as any[];
  } catch {
    return [];
  }
}

// Match Lineups: GET via football-api
export async function fetchMatchLineups(fixtureId: string) {
  try {
    const data = await callFootballApi('lineups', { fixtureId });
    return (data?.response || []) as any[];
  } catch {
    return [];
  }
}

// Match Player Stats (ratings): direct API-Football call
export async function fetchMatchPlayerStats(fixtureId: string) {
  try {
    const resp = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${fixtureId}`,
      { headers: { 'x-apisports-key': '99feb45f7f73a93bf78f2958c79c2224' } }
    );
    const json = await resp.json();
    return (json?.response || []) as any[];
  } catch {
    return [];
  }
}

// H2H: POST via edge function (sends team names for API-Football lookup)
export async function fetchH2H(homeTeam: string, awayTeam: string) {
  try {
    const { data } = await supabase.functions.invoke('h2h-history', {
      body: { homeTeam, awayTeam },
    });
    return data;
  } catch {
    return null;
  }
}
