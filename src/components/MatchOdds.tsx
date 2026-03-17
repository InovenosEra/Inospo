import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

// FIFA Rankings (December 2024) — used for win probability
const FIFA_RANKINGS: Record<string, number> = {
  // UEFA
  'Italy': 10, 'Wales': 28, 'Bosnia-Herzegovina': 75, 'Northern Ireland': 73,
  'Ukraine': 22, 'Sweden': 45, 'Poland': 30, 'Albania': 64, 'Slovakia': 49,
  'Kosovo': 102, 'Turkey': 42, 'Romania': 35, 'Czechia': 44, 'Ireland': 58,
  'Denmark': 21, 'North Macedonia': 68,
  // Top nations
  'France': 2, 'Brazil': 3, 'England': 4, 'Belgium': 5, 'Portugal': 6,
  'Netherlands': 7, 'Spain': 8, 'Argentina': 1, 'Germany': 9,
  'USA': 11, 'Mexico': 15, 'Canada': 40,
  // Intercontinental
  'New Caledonia': 161, 'Jamaica': 63, 'DR Congo': 60,
  'Bolivia': 88, 'Suriname': 137, 'Iraq': 63,
};

// Recent form (last 5: W/D/L)
type FormResult = 'W' | 'D' | 'L';
const TEAM_FORM: Record<string, FormResult[]> = {
  'Italy': ['W', 'W', 'D', 'W', 'W'],
  'Wales': ['W', 'D', 'L', 'W', 'D'],
  'Ukraine': ['W', 'W', 'W', 'D', 'W'],
  'Denmark': ['W', 'W', 'W', 'W', 'D'],
  'Turkey': ['W', 'W', 'W', 'D', 'W'],
};

function calculateWinProbability(homeRank: number, awayRank: number) {
  const rankDiff = awayRank - homeRank;
  const baseDraw = 0.22;
  const homeWinBase = 1 / (1 + Math.pow(10, -rankDiff / 100));
  const homeAdvantage = 0.06;
  const homeWin = Math.min(0.85, Math.max(0.1, homeWinBase + homeAdvantage));
  const awayWin = Math.min(0.85, Math.max(0.1, 1 - homeWin - baseDraw));
  const draw = 1 - homeWin - awayWin;
  return {
    home: Math.round(homeWin * 100),
    draw: Math.round(draw * 100),
    away: Math.round(awayWin * 100),
  };
}

const FORM_COLORS: Record<FormResult, string> = {
  W: Colors.accent,
  D: Colors.draw,
  L: Colors.loss,
};

interface Props {
  homeTeam: string;
  awayTeam: string;
}

export function MatchOdds({ homeTeam, awayTeam }: Props) {
  if (homeTeam.includes('TBD') || awayTeam.includes('TBD') ||
      homeTeam.includes('Winner') || awayTeam.includes('Winner')) {
    return null;
  }

  const homeRank = FIFA_RANKINGS[homeTeam];
  const awayRank = FIFA_RANKINGS[awayTeam];

  if (!homeRank || !awayRank) return null;

  const odds = calculateWinProbability(homeRank, awayRank);
  const favorite = odds.home > odds.away ? 'home' : odds.away > odds.home ? 'away' : 'draw';

  const homeForm = TEAM_FORM[homeTeam];
  const awayForm = TEAM_FORM[awayTeam];

  return (
    <View style={styles.container}>
      {/* Form row */}
      {(homeForm || awayForm) && (
        <View style={styles.formRow}>
          <View style={styles.formSide}>
            <Text style={styles.teamCode}>{homeTeam.slice(0, 3).toUpperCase()}</Text>
            {homeForm && (
              <View style={styles.formDots}>
                {homeForm.map((r, i) => (
                  <View key={i} style={[styles.formDot, { backgroundColor: FORM_COLORS[r] }]}>
                    <Text style={styles.formLetter}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.formLabel}>Form</Text>
          <View style={[styles.formSide, styles.formSideRight]}>
            {awayForm && (
              <View style={styles.formDots}>
                {awayForm.map((r, i) => (
                  <View key={i} style={[styles.formDot, { backgroundColor: FORM_COLORS[r] }]}>
                    <Text style={styles.formLetter}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.teamCode}>{awayTeam.slice(0, 3).toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* Win probability */}
      <View style={styles.oddsRow}>
        <Text style={styles.oddsLabel}>Win %</Text>
        <View style={styles.oddsValues}>
          <Text style={[styles.oddsVal, favorite === 'home' && styles.oddsValFav]}>
            {odds.home}%
          </Text>
          <Text style={styles.oddsDraw}>{odds.draw}%</Text>
          <Text style={[styles.oddsVal, favorite === 'away' && styles.oddsValFav]}>
            {odds.away}%
          </Text>
        </View>
      </View>

      {/* Visual bar */}
      <View style={styles.bar}>
        <View style={[styles.barHome, { flex: odds.home }]} />
        <View style={[styles.barDraw, { flex: odds.draw }]} />
        <View style={[styles.barAway, { flex: odds.away }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  formSideRight: { justifyContent: 'flex-end' },
  formDots: { flexDirection: 'row', gap: 2 },
  formDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formLetter: { color: '#fff', fontSize: 7, fontWeight: '700' },
  formLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs - 1,
    textAlign: 'center',
    minWidth: 32,
  },
  teamCode: { color: Colors.textMuted, fontSize: Typography.xs },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  oddsLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    flex: 1,
  },
  oddsValues: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  oddsVal: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '600' },
  oddsValFav: {
    color: Colors.primary,
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  oddsDraw: { color: Colors.textMuted, fontSize: Typography.xs },
  bar: {
    flexDirection: 'row',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  barHome: { backgroundColor: Colors.primary },
  barDraw: { backgroundColor: Colors.textMuted, opacity: 0.3 },
  barAway: { backgroundColor: Colors.accent },
});
