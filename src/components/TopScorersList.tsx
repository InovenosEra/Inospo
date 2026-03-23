import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import type { TopScorer } from '@/types';

interface Props {
  scorers: TopScorer[];
}

export function TopScorersList({ scorers }: Props) {
  if (scorers.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⚽</Text>
        <Text style={styles.emptyText}>Scorer data will be available once matches begin</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.col, { flex: 1 }]}>Player</Text>
        <Text style={styles.col}>Goals</Text>
        <Text style={styles.col}>Assists</Text>
      </View>
      {scorers.map((scorer, idx) => (
        <View key={scorer.player_id} style={[styles.row, idx % 2 === 0 && styles.rowAlt]}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{idx + 1}</Text>
          </View>
          <View style={styles.playerInfo}>
            {scorer.image_path && (
              <Image source={{ uri: scorer.image_path }} style={styles.avatar} />
            )}
            <View>
              <Text style={styles.playerName}>{scorer.player_name}</Text>
              <Text style={styles.teamName}>{scorer.team_name}</Text>
            </View>
          </View>
          <Text style={styles.goals}>{scorer.goals}</Text>
          <Text style={styles.assists}>{scorer.assists}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  col: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    width: scale(60),
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    gap: Spacing.sm,
  },
  rowAlt: { backgroundColor: Colors.card },
  rankBadge: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: '800' },
  playerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: Colors.cardElevated },
  playerName: { color: Colors.text, fontSize: Typography.sm, fontWeight: '700' },
  teamName: { color: Colors.textMuted, fontSize: Typography.xs },
  goals: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: Typography.base,
    width: scale(60),
    textAlign: 'center',
  },
  assists: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: Typography.sm,
    width: scale(60),
    textAlign: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center' },
});
