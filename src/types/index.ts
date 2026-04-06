// ─── Database Types (matching Supabase schema exactly) ────────────────────────

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_points: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  group_name: string | null;
  created_at: string | null;
}

export interface Match {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  stadium: string | null;
  city: string | null;
  stage: string | null;
  status: string | null;
  created_at: string | null;
  // Joined via select
  home_team?: Team;
  away_team?: Team;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'completed' | 'postponed';

export interface Prediction {
  id: string;
  user_id: string | null;
  match_id: string | null;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;   // 5 = exact score, 2 = correct result, 0 = wrong
  created_at: string | null;
  updated_at: string | null;
  // Joined
  match?: Match;
}

export interface League {
  id: string;
  name: string;
  code: string | null;
  is_global: boolean | null;
  owner_id: string | null;
  created_at: string | null;
  // Computed
  member_count?: number;
}

export interface LeagueMember {
  id: string;
  league_id: string | null;
  user_id: string | null;
  joined_at: string | null;
  // Joined
  profile?: Profile;
}

export type AppRole = 'admin' | 'user';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

// ─── UI / App Types ────────────────────────────────────────────────────────────

export type MatchFilter = 'all' | 'upcoming' | 'live' | 'completed';

export type StatsView = 'standings' | 'bracket' | 'scorers';

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface TopScorer {
  player_id: number;
  player_name: string;
  team_name: string;
  team_code: string;
  goals: number;
  assists: number;
  image_path?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;      // matches edge function field name
  image_url?: string;
  teams?: string[];       // team codes e.g. ['ARG', 'BRA']
  category?: string;
  date?: string;          // formatted string e.g. "2h ago"
  rawDate?: string;       // ISO date string
}

export interface LeaderboardEntry {
  rank: number;
  profile: Profile;
  total_points: number;
  correct_predictions: number;
}

export interface QualificationFixture {
  id: number | string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string;
  status: 'scheduled' | 'live' | 'completed' | 'tbd';
  round: string;
  stage: string;
}

// Helpers
export function getMatchStatus(match: Match): MatchStatus {
  const s = match.status?.toLowerCase() || 'scheduled';
  if (s === 'live' || s === '1h' || s === '2h' || s === 'ht') return 'live';
  if (s === 'finished' || s === 'completed' || s === 'ft' || s === 'aet') return 'finished';
  if (s === 'postponed') return 'postponed';
  return 'scheduled';
}

export function canPredict(match: Match): boolean {
  const status = getMatchStatus(match);
  if (status !== 'scheduled') return false;
  const minutesToKickoff = (new Date(match.match_date).getTime() - Date.now()) / 60000;
  return minutesToKickoff > 15;
}
