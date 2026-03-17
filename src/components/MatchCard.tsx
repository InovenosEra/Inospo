import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { fetchPredictionForMatch } from '@/lib/api';
import { getMatchStatus, canPredict } from '@/types';
import { MatchOdds } from './MatchOdds';
import type { Match } from '@/types';

interface Props {
  match: Match;
  onPredictPress?: () => void;
  userId?: string;
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
  const timeStr = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const pointsColor =
    (prediction?.points_earned ?? 0) === 5 ? Colors.primary
    : (prediction?.points_earned ?? 0) === 2 ? Colors.accent
    : Colors.textMuted;

  const stageText = match.stage === 'group'
    ? [
        `GROUP ${match.home_team?.group_name ?? ''}`,
        match.city,
      ].filter(Boolean).join(' · ')
    : [
        (match.stage ?? '').toUpperCase(),
        match.city,
      ].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/match/${match.id}`)}
    >
      {/* Stage / Status Row */}
      <View style={styles.topRow}>
        <Text style={styles.stageText}>{stageText}</Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        {isFinished && <Text style={styles.finishedText}>FT</Text>}
        {!isLive && !isFinished && (
          <Text style={styles.timeText}>{dateStr} · {timeStr}</Text>
        )}
      </View>

      {/* Teams & Score */}
      <View style={styles.teamsRow}>
        {/* Home */}
        <View style={styles.teamSide}>
          <Image
            source={{ uri: match.home_team?.flag_url ?? undefined }}
            style={styles.flag}
            resizeMode="contain"
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
            resizeMode="contain"
          />
          <Text style={styles.teamName} numberOfLines={1}>{match.away_team?.name}</Text>
        </View>
      </View>

      {/* Stadium */}
      {match.stadium && (
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.venueText} numberOfLines={1}>
            {[match.stadium, match.city].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}

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
    flex: 1,
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
  finishedText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '700' },
  timeText: { color: Colors.textSecondary, fontSize: Typography.xs },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  teamRight: { alignItems: 'flex-end' },
  flag: { width: 40, height: 28, borderRadius: 4 },
  teamName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
  scoreBox: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  score: { fontSize: Typography.xl, fontWeight: '900', color: Colors.text },
  scoreLive: { color: Colors.live },
  vs: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textMuted },
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
    gap: 4,
    marginTop: Spacing.sm,
  },
  venueText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    flex: 1,
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
