import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchMatchById, fetchMatchFact } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PredictionModal } from '@/components/PredictionModal';
import { useCountdown } from '@/hooks/useCountdown';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, profile } = useAuth();
  const [showPrediction, setShowPrediction] = useState(false);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => fetchMatchById(id),
  });

  const { data: fact } = useQuery({
    queryKey: ['match-fact', id],
    queryFn: () => fetchMatchFact(match!),
    enabled: !!match,
    staleTime: 10 * 60 * 1000,
  });

  const countdown = useCountdown(match?.match_date ?? new Date().toISOString());

  if (isLoading || !match) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isScheduled = match.status === 'scheduled';
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
        <Text style={styles.backText}>Matches</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Match Hero */}
        <View style={styles.hero}>
          {/* Home Team */}
          <View style={styles.teamBlock}>
            <Image
              source={{ uri: match.home_team?.flag_url ?? undefined }}
              style={styles.flag}
              resizeMode="contain"
            />
            <Text style={styles.teamName}>{match.home_team?.name}</Text>
            <Text style={styles.teamCode}>{match.home_team?.code}</Text>
          </View>

          {/* Score / VS */}
          <View style={styles.scoreBlock}>
            {isFinished || isLive ? (
              <Text style={styles.score}>
                {match.home_score ?? '-'} – {match.away_score ?? '-'}
              </Text>
            ) : (
              <Text style={styles.vs}>VS</Text>
            )}
            {isLive && (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            {isScheduled && !countdown.isExpired && (
              <Text style={styles.countdownText}>
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </Text>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamBlock}>
            <Image
              source={{ uri: match.away_team?.flag_url ?? undefined }}
              style={styles.flag}
              resizeMode="contain"
            />
            <Text style={styles.teamName}>{match.away_team?.name}</Text>
            <Text style={styles.teamCode}>{match.away_team?.code}</Text>
          </View>
        </View>

        {/* Venue */}
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.venueText}>{match.stadium}, {match.city}</Text>
          <Text style={styles.stageChip}>{match.stage}</Text>
        </View>

        {/* Match Date */}
        <Text style={styles.dateText}>
          {new Date(match.match_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {/* Predict Button */}
        {isScheduled && isAuthenticated && (
          <TouchableOpacity
            style={styles.predictBtn}
            onPress={() => setShowPrediction(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.predictBtnText}>Make Prediction</Text>
          </TouchableOpacity>
        )}

        {/* AI Match Fact */}
        {fact ? (
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>⚡ Match Insight</Text>
            <Text style={styles.factText}>{fact}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Prediction Modal */}
      {match && (
        <PredictionModal
          match={match}
          userId={profile?.id ?? ''}
          visible={showPrediction}
          onClose={() => setShowPrediction(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backText: { color: Colors.text, fontSize: Typography.base, marginLeft: 4 },
  scroll: { paddingHorizontal: Spacing.lg },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  teamBlock: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  flag: { width: 64, height: 48, borderRadius: Radius.sm },
  teamName: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  teamCode: { color: Colors.textSecondary, fontSize: Typography.xs },
  scoreBlock: { alignItems: 'center', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  score: { fontSize: Typography.xxl, fontWeight: '900', color: Colors.primary },
  vs: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textMuted },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.liveDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.live },
  liveText: { color: Colors.live, fontSize: Typography.xs, fontWeight: '700' },
  countdownText: { color: Colors.textSecondary, fontSize: Typography.xs },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  venueText: { color: Colors.textSecondary, fontSize: Typography.sm, flex: 1 },
  stageChip: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    textTransform: 'uppercase',
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginBottom: Spacing.xl,
  },
  predictBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    ...Shadows.gold,
  },
  predictBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  factCard: {
    backgroundColor: Colors.cardElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  factLabel: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  factText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: 22,
  },
});
