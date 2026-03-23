import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import { fetchPredictionForMatch } from '@/lib/api';
import { getMatchStatus, canPredict } from '@/types';
import { MatchOdds } from './MatchOdds';
import type { Match } from '@/types';

interface Props {
  match: Match;
  onPredictPress?: () => void;
  userId?: string;
}

// WC2026 host venue → { city, region }
const VENUE_LOCATION: Record<string, { city: string; region: string }> = {
  // USA
  'sofi stadium':               { city: 'Los Angeles',      region: 'CA' },
  "levi's stadium":             { city: 'Santa Clara',      region: 'CA' },
  'lumen field':                { city: 'Seattle',          region: 'WA' },
  "at&t stadium":               { city: 'Arlington',        region: 'TX' },
  'nrg stadium':                { city: 'Houston',          region: 'TX' },
  'geha field at arrowhead stadium': { city: 'Kansas City', region: 'MO' },
  'arrowhead stadium':          { city: 'Kansas City',      region: 'MO' },
  'hard rock stadium':          { city: 'Miami',            region: 'FL' },
  'lincoln financial field':    { city: 'Philadelphia',     region: 'PA' },
  'gillette stadium':           { city: 'Foxborough',       region: 'MA' },
  'mercedes-benz stadium':      { city: 'Atlanta',          region: 'GA' },
  'metlife stadium':            { city: 'East Rutherford',  region: 'NJ' },
  // Canada
  'bmo field':                  { city: 'Toronto',          region: 'ON' },
  'bc place':                   { city: 'Vancouver',        region: 'BC' },
  // Mexico
  'estadio azteca':             { city: 'Mexico City',      region: 'Mexico' },
  'estadio akron':              { city: 'Guadalajara',      region: 'Mexico' },
  'estadio bbva':               { city: 'Monterrey',        region: 'Mexico' },
};

// City → region fallback
const CITY_REGION: Record<string, string> = {
  // USA
  'los angeles': 'CA', 'santa clara': 'CA', 'seattle': 'WA',
  'arlington': 'TX', 'houston': 'TX', 'kansas city': 'MO',
  'miami': 'FL', 'philadelphia': 'PA', 'foxborough': 'MA',
  'atlanta': 'GA', 'east rutherford': 'NJ', 'new york': 'NJ',
  // Canada
  'toronto': 'ON', 'vancouver': 'BC',
  // Mexico
  'mexico city': 'Mexico', 'guadalajara': 'Mexico', 'monterrey': 'Mexico',
  'culiacan': 'Mexico', 'culiacán': 'Mexico',
  'ciudad de mexico': 'Mexico', 'cdmx': 'Mexico',
};

function getVenueLocation(stadium: string | null, city: string | null): { city: string; region: string | null } | null {
  if (stadium) {
    const match = VENUE_LOCATION[stadium.toLowerCase()];
    if (match) return match;
  }
  if (city) {
    const region = CITY_REGION[city.toLowerCase()] ?? null;
    return { city, region };
  }
  return null;
}

function getCountdown(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return '';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  return `${hours}h ${minutes}m`;
}

export function MatchCard({ match, onPredictPress, userId }: Props) {
  const router = useRouter();
  const status = getMatchStatus(match);
  const isLive = status === 'live';
  const isFinished = status === 'finished';
  const isPredictable = canPredict(match);
  const countdown = !isLive && !isFinished ? getCountdown(match.match_date) : '';

  const { data: prediction } = useQuery({
    queryKey: ['prediction', userId, match.id],
    queryFn: () => fetchPredictionForMatch(userId!, match.id),
    enabled: !!userId,
  });

  const matchDate = new Date(match.match_date);
  const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const pointsColor =
    (prediction?.points_earned ?? 0) === 5 ? Colors.primary
    : (prediction?.points_earned ?? 0) === 2 ? Colors.accent
    : Colors.textMuted;

  const stageText = match.stage === 'group'
    ? `GROUP ${match.home_team?.group_name ?? ''}`
    : (match.stage ?? '').toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/match/${match.id}`)}
    >
      {/* Stage / Status Row */}
      <View style={styles.topRow}>
        {/* Left: date/time or match status */}
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : isFinished ? (
          <Text style={styles.finishedText}>FT</Text>
        ) : (
          <Text style={styles.timeText}>{dateStr} · {timeStr}</Text>
        )}
        {/* Right: group/stage */}
        <Text style={styles.stageText}>{stageText}</Text>
      </View>

      {/* Teams & Score */}
      <View style={styles.teamsRow}>
        {/* Home */}
        <View style={styles.teamSide}>
          <Image
            source={{ uri: match.home_team?.flag_url ?? undefined }}
            style={styles.flag}
            resizeMode="cover"
          />
          <Text style={styles.teamName} numberOfLines={1}>{match.home_team?.name}</Text>
        </View>

        {/* Score / VS + countdown */}
        <View style={styles.scoreBox}>
          {isFinished || isLive ? (
            <Text style={[styles.score, isLive && styles.scoreLive]}>
              {match.home_score ?? 0} – {match.away_score ?? 0}
            </Text>
          ) : (
            <Text style={styles.vs}>VS</Text>
          )}
          {countdown ? (
            <View style={styles.countdownBadge}>
              <Ionicons name="time-outline" size={11} color={Colors.primary} />
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          ) : null}
          {/* Prediction badge */}
          {prediction && (
            <Text style={[styles.predBadge, { color: pointsColor }]}>
              {prediction.predicted_home_score}–{prediction.predicted_away_score}
              {isFinished && prediction.points_earned != null
                ? ` +${prediction.points_earned}pts`
                : ''}
            </Text>
          )}
        </View>

        {/* Away */}
        <View style={[styles.teamSide, styles.teamRight]}>
          <Image
            source={{ uri: match.away_team?.flag_url ?? undefined }}
            style={styles.flag}
            resizeMode="cover"
          />
          <Text style={styles.teamName} numberOfLines={1}>{match.away_team?.name}</Text>
        </View>
      </View>

      {/* Venue */}
      {match.stadium && (() => {
        const loc = getVenueLocation(match.stadium, match.city);
        const venueStr = loc
          ? [match.stadium, loc.city, loc.region].filter(Boolean).join(', ')
          : match.stadium;
        return (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.venueText} numberOfLines={1}>{venueStr}</Text>
          </View>
        );
      })()}

      {/* Win probability + form (only for scheduled matches with known teams) */}
      {!isFinished && !isLive && match.home_team && match.away_team && (
        <MatchOdds
          homeTeam={match.home_team.name}
          awayTeam={match.away_team.name}
        />
      )}

      {/* Predict Button */}
      {isPredictable && onPredictPress && !prediction && (
        <TouchableOpacity
          style={styles.predictBtn}
          onPress={(e) => { e.stopPropagation?.(); onPredictPress(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.predictBtnText}>Predict Score</Text>
        </TouchableOpacity>
      )}

      {isPredictable && onPredictPress && prediction && (
        <TouchableOpacity
          style={[styles.predictBtn, styles.updateBtn]}
          onPress={(e) => { e.stopPropagation?.(); onPredictPress(); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.predictBtnText, { color: Colors.primary }]}>Update Prediction</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stageText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.liveDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.live },
  liveText: { color: Colors.live, fontSize: Typography.xs, fontWeight: '800' },
  finishedText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  teamRight: {},
  flag: { width: scale(40), height: scale(28), borderRadius: 6, overflow: 'hidden' },
  teamName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  scoreBox: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  score: { fontSize: Typography.xl, fontWeight: '900', color: Colors.text },
  scoreLive: { color: Colors.live },
  vs: { fontSize: Typography.base, fontWeight: '800', color: Colors.textMuted },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  countdownText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  predBadge: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  venueText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
  },
  predictBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    alignItems: 'center',
    ...Shadows.gold,
  },
  updateBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  predictBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
});
