import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import type { Match } from '@/types';

interface Props {
  matches: Match[];
}

const KNOCKOUT_STAGES = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

// FIFA's published Round-of-32 pairings for WC 2026.
// 12 group winners + 12 runners-up + 8 best 3rd-places → 16 matches.
// "1A" = winner of Group A · "2A" = runner-up of Group A · "3rd" = best-3rd slot.
const R32_PAIRS: Array<[string, string]> = [
  ['1A', '2C'], ['1C', '3rd'], ['1B', '3rd'], ['1F', '3rd'],
  ['1D', '3rd'], ['1L', '2K'], ['1G', '2J'], ['1J', '3rd'],
  ['1H', '3rd'], ['1E', '3rd'], ['1K', '2I'], ['1I', '2H'],
  ['2A', '2B'], ['2D', '2L'], ['2E', '2F'], ['2G', '3rd'],
];

// Cumulative match count *before* each stage (R32 starts at M1).
//   R32  R16  QF  SF  Final
const STAGE_OFFSET = [0, 16, 24, 28, 30];

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
            <Ionicons name="trophy-outline" size={42} color={Colors.primary} />
            <Text style={styles.placeholderTitle}>Knockout Stage</Text>
            <Text style={styles.placeholderText}>
              The bracket fills in as the group stage concludes.{'\n'}
              Slots show how each group seeds into the Round of 32.
            </Text>
            <View style={styles.mockBracket}>
              {KNOCKOUT_STAGES.map((stage, stageIdx) => {
                const slotCount = Math.max(1, 16 / (2 ** stageIdx));
                return (
                  <View key={stage} style={styles.mockStage}>
                    <Text style={styles.mockStageLabel}>{stage}</Text>
                    {Array.from({ length: slotCount }).map((_, i) => {
                      // Round of 32 — show actual FIFA seed pairings
                      if (stageIdx === 0) {
                        const [home, away] = R32_PAIRS[i] ?? ['?', '?'];
                        return (
                          <View key={i} style={styles.mockCard}>
                            <Text style={styles.mockSlotText} numberOfLines={1}>{home}</Text>
                            <View style={styles.mockSlotDivider} />
                            <Text style={styles.mockSlotText} numberOfLines={1}>{away}</Text>
                          </View>
                        );
                      }
                      // Later rounds — show winners of the two upstream matches.
                      const prevStageStart = STAGE_OFFSET[stageIdx - 1] + 1;
                      const m1 = prevStageStart + i * 2;
                      const m2 = m1 + 1;
                      return (
                        <View key={i} style={styles.mockCard}>
                          <Text style={styles.mockSlotTextSmall} numberOfLines={1}>W·M{m1}</Text>
                          <View style={styles.mockSlotDivider} />
                          <Text style={styles.mockSlotTextSmall} numberOfLines={1}>W·M{m2}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
            <Text style={styles.legend}>
              <Text style={styles.legendBold}>1A</Text> = Group A winner ·{' '}
              <Text style={styles.legendBold}>2C</Text> = Group C runner-up ·{' '}
              <Text style={styles.legendBold}>3rd</Text> = best 3rd-place
            </Text>
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
    width: scale(120),
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
    minWidth: scale(340),
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  placeholderTitle: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  mockBracket: { flexDirection: 'row', gap: Spacing.xs },
  mockStage: { width: scale(64), gap: scale(6) },
  mockStageLabel: {
    color: Colors.primary,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mockCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scale(36),
  },
  mockSlotText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  mockSlotTextSmall: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  mockSlotDivider: {
    width: '60%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  legend: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: 16,
  },
  legendBold: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
