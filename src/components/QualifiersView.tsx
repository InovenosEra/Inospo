import { useQuery } from '@tanstack/react-query';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { fetchQualificationFixtures } from '@/lib/api';
import type { QualificationFixture } from '@/types';

export function QualifiersView() {
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['qualifiers'],
    queryFn: fetchQualificationFixtures,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>Loading qualification fixtures...</Text>
      </View>
    );
  }

  if (fixtures.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🌍</Text>
        <Text style={styles.emptyTitle}>Qualification Phase Complete</Text>
        <Text style={styles.emptyText}>
          All 48 teams have qualified for the 2026 FIFA World Cup.{'\n'}
          The group stage begins June 2026.
        </Text>
      </View>
    );
  }

  // Group by round
  const byRound: Record<string, QualificationFixture[]> = {};
  for (const f of fixtures) {
    const key = f.round || f.stage || 'Qualifying';
    if (!byRound[key]) byRound[key] = [];
    byRound[key].push(f);
  }

  return (
    <View>
      {Object.entries(byRound).map(([round, roundFixtures]) => (
        <View key={round}>
          <Text style={styles.roundHeader}>{round}</Text>
          {roundFixtures.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} />
          ))}
        </View>
      ))}
    </View>
  );
}

function FixtureCard({ fixture }: { fixture: QualificationFixture }) {
  const isLive = fixture.status === 'live';
  const isCompleted = fixture.status === 'completed';

  return (
    <View style={styles.card}>
      <View style={styles.matchRow}>
        {/* Home */}
        <View style={styles.teamCol}>
          {fixture.homeFlag ? (
            <Image source={{ uri: fixture.homeFlag }} style={styles.flag} resizeMode="contain" />
          ) : null}
          <Text style={styles.team} numberOfLines={1}>{fixture.homeTeam}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreBox}>
          {isLive && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          {isCompleted || isLive ? (
            <Text style={[styles.score, isLive && styles.scoreLive]}>
              {fixture.homeScore ?? 0} – {fixture.awayScore ?? 0}
            </Text>
          ) : (
            <Text style={styles.vs}>vs</Text>
          )}
          {!isLive && !isCompleted && fixture.date && (
            <Text style={styles.date}>
              {new Date(fixture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>

        {/* Away */}
        <View style={[styles.teamCol, styles.teamRight]}>
          {fixture.awayFlag ? (
            <Image source={{ uri: fixture.awayFlag }} style={styles.flag} resizeMode="contain" />
          ) : null}
          <Text style={[styles.team, { textAlign: 'right' }]} numberOfLines={1}>{fixture.awayTeam}</Text>
        </View>
      </View>

      {fixture.venue ? (
        <Text style={styles.venue}>{fixture.venue}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontSize: Typography.sm },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: Colors.text, fontSize: Typography.lg, fontWeight: '700' },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },
  roundHeader: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  matchRow: { flexDirection: 'row', alignItems: 'center' },
  teamCol: { flex: 1, alignItems: 'flex-start', gap: 4 },
  teamRight: { alignItems: 'flex-end' },
  flag: { width: 28, height: 20, borderRadius: 2 },
  team: { color: Colors.text, fontSize: Typography.sm, fontWeight: '600' },
  scoreBox: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: 2 },
  score: { color: Colors.primary, fontWeight: '800', fontSize: Typography.md },
  scoreLive: { color: Colors.live },
  vs: { color: Colors.textMuted, fontWeight: '600' },
  date: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.liveDim,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.live },
  liveText: { color: Colors.live, fontSize: 9, fontWeight: '800' },
  venue: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: Spacing.xs, textAlign: 'center' },
});
