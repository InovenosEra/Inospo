import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { LeaderboardEntry } from '@/types';

interface Props {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderboardRow({ entry, isCurrentUser }: Props) {
  const medal = MEDAL[entry.rank];

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      {/* Rank */}
      <View style={styles.rankBox}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rank, entry.rank <= 10 && styles.rankTop]}>{entry.rank}</Text>
        )}
      </View>

      {/* Avatar placeholder */}
      <View style={[styles.avatar, isCurrentUser && styles.avatarHighlight]}>
        <Text style={styles.avatarText}>
          {(entry.profile.username ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Username */}
      <View style={styles.nameCol}>
        <Text style={[styles.username, isCurrentUser && styles.usernameHighlight]} numberOfLines={1}>
          {entry.profile.username ?? 'Anonymous'}
          {isCurrentUser ? ' (you)' : ''}
        </Text>
      </View>

      {/* Points */}
      <Text style={[styles.points, isCurrentUser && styles.pointsHighlight]}>
        {entry.total_points} pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  rowHighlight: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  rankBox: { width: 28, alignItems: 'center' },
  medal: { fontSize: Typography.lg },
  rank: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  rankTop: { color: Colors.primary },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarHighlight: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  avatarText: { color: Colors.text, fontWeight: '700', fontSize: Typography.base },
  nameCol: { flex: 1 },
  username: { color: Colors.text, fontWeight: '600', fontSize: Typography.base },
  usernameHighlight: { color: Colors.primary },
  points: { color: Colors.textSecondary, fontWeight: '700', fontSize: Typography.sm },
  pointsHighlight: { color: Colors.primary },
});
