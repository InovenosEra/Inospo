import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { Prediction } from '@/types';

interface Props {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: Props) {
  const match = prediction.match;
  if (!match) return null;

  const isFinished = match.status === 'finished';
  const hasPoints = prediction.points_earned > 0;

  return (
    <View style={[styles.card, hasPoints && styles.cardCorrect]}>
      {/* Teams */}
      <View style={styles.teamsRow}>
        <View style={styles.teamSide}>
          <Image source={{ uri: match.home_team?.flag_url }} style={styles.flag} resizeMode="contain" />
          <Text style={styles.teamName} numberOfLines={1}>{match.home_team?.name}</Text>
        </View>

        <View style={styles.middle}>
          <Text style={styles.predLabel}>Your Pick</Text>
          <Text style={styles.predScore}>
            {prediction.predicted_home_score} – {prediction.predicted_away_score}
          </Text>
          {isFinished && (
            <>
              <Text style={styles.actualLabel}>Result</Text>
              <Text style={styles.actualScore}>
                {match.home_score ?? '?'} – {match.away_score ?? '?'}
              </Text>
            </>
          )}
        </View>

        <View style={[styles.teamSide, styles.teamRight]}>
          <Image source={{ uri: match.away_team?.flag_url }} style={styles.flag} resizeMode="contain" />
          <Text style={styles.teamName} numberOfLines={1}>{match.away_team?.name}</Text>
        </View>
      </View>

      {/* Points */}
      {isFinished && (
        <View style={[styles.pointsRow, hasPoints && styles.pointsRowCorrect]}>
          <Text style={[styles.pointsText, hasPoints && styles.pointsTextCorrect]}>
            {hasPoints ? `+${prediction.points_earned} pts earned` : 'No points'}
          </Text>
        </View>
      )}

      {/* Pending */}
      {!isFinished && (
        <View style={styles.pendingRow}>
          <Text style={styles.pendingText}>⏰ Awaiting kick-off</Text>
        </View>
      )}
    </View>
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
  },
  cardCorrect: { borderColor: Colors.accent },
  teamsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  teamSide: { flex: 1, alignItems: 'flex-start', gap: Spacing.xs },
  teamRight: { alignItems: 'flex-end' },
  flag: { width: 36, height: 26, borderRadius: 3 },
  teamName: { color: Colors.text, fontSize: Typography.xs, fontWeight: '600' },
  middle: { alignItems: 'center', paddingHorizontal: Spacing.md },
  predLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginBottom: 2 },
  predScore: { color: Colors.text, fontSize: Typography.md, fontWeight: '800' },
  actualLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: Spacing.xs },
  actualScore: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '600' },
  pointsRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    alignItems: 'center',
  },
  pointsRowCorrect: { borderTopColor: Colors.accent },
  pointsText: { color: Colors.textMuted, fontSize: Typography.sm },
  pointsTextCorrect: { color: Colors.accent, fontWeight: '700' },
  pendingRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    alignItems: 'center',
  },
  pendingText: { color: Colors.textMuted, fontSize: Typography.xs },
});
