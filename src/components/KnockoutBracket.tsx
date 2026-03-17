import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { Match } from '@/types';

interface Props {
  matches: Match[];
}

const KNOCKOUT_STAGES = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

export function KnockoutBracket({ matches }: Props) {
  const knockoutMatches = matches.filter((m) => m.stage !== 'group');

  const byStage: Record<string, Match[]> = {};
  for (const stage of KNOCKOUT_STAGES) {
    byStage[stage] = knockoutMatches.filter((m) => m.stage === stage);
  }

  const hasKnockout = knockoutMatches.length > 0;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.bracket}>
        {hasKnockout ? (
          KNOCKOUT_STAGES.map((stage) => (
            byStage[stage]?.length > 0 && (
              <View key={stage} style={styles.stageColumn}>
                <Text style={styles.stageTitle}>{stage}</Text>
                {byStage[stage].map((match) => (
                  <BracketCard key={match.id} match={match} />
                ))}
              </View>
            )
          ))
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🏆</Text>
            <Text style={styles.placeholderTitle}>Knockout Stage</Text>
            <Text style={styles.placeholderText}>
              The bracket will be set after the{'\n'}group stage concludes.
            </Text>
            <View style={styles.mockBracket}>
              {KNOCKOUT_STAGES.map((stage) => (
                <View key={stage} style={styles.mockStage}>
                  <Text style={styles.mockStageLabel}>{stage}</Text>
                  {Array.from({ length: Math.max(1, 16 / (2 ** KNOCKOUT_STAGES.indexOf(stage))) }).map((_, i) => (
                    <View key={i} style={styles.mockCard} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function BracketCard({ match }: { match: Match }) {
  return (
    <View style={styles.card}>
      <TeamRow
        name={match.home_team?.name ?? 'TBD'}
        code={match.home_team?.code}
        score={match.home_score}
        isWinner={
          match.status === 'finished' &&
          match.home_score != null &&
          match.away_score != null &&
          match.home_score > match.away_score
        }
      />
      <View style={styles.cardDivider} />
      <TeamRow
        name={match.away_team?.name ?? 'TBD'}
        code={match.away_team?.code}
        score={match.away_score}
        isWinner={
          match.status === 'finished' &&
          match.home_score != null &&
          match.away_score != null &&
          match.away_score > match.home_score
        }
      />
    </View>
  );
}

function TeamRow({
  name,
  code,
  score,
  isWinner,
}: {
  name: string;
  code?: string;
  score: number | null | undefined;
  isWinner: boolean;
}) {
  return (
    <View style={[styles.teamRow, isWinner && styles.teamRowWinner]}>
      <Text style={[styles.teamCode, isWinner && styles.teamCodeWinner]} numberOfLines={1}>
        {code ?? '???'}
      </Text>
      {score != null && (
        <Text style={[styles.teamScore, isWinner && styles.teamScoreWinner]}>{score}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bracket: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  stageColumn: {
    width: 120,
    gap: Spacing.md,
  },
  stageTitle: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cardDivider: { height: 1, backgroundColor: Colors.border },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  teamRowWinner: { backgroundColor: Colors.primaryDim },
  teamCode: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: '600',
    flex: 1,
  },
  teamCodeWinner: { color: Colors.primary },
  teamScore: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: '700',
    marginLeft: 4,
  },
  teamScoreWinner: { color: Colors.primary },
  placeholder: {
    minWidth: 340,
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  placeholderIcon: { fontSize: 48, marginBottom: Spacing.md },
  placeholderTitle: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  mockBracket: { flexDirection: 'row', gap: Spacing.sm },
  mockStage: { width: 80, gap: Spacing.sm },
  mockStageLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
  },
  mockCard: {
    height: 32,
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    opacity: 0.5,
  },
});
