import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

// FIFA Rankings — all 53 WC 2026 teams (Jan 2025 approximation)
const FIFA_RANKINGS: Record<string, number> = {
  // Top tier
  'Argentina': 1,
  'France': 2,
  'Spain': 3,
  'England': 4,
  'Brazil': 5,
  'Belgium': 6,
  'Portugal': 7,
  'Netherlands': 8,
  'Germany': 9,
  'Italy': 10,
  'USA': 11,
  'Croatia': 12,
  'Morocco': 13,
  'Uruguay': 14,
  'Mexico': 15,
  'Colombia': 16,
  'Switzerland': 17,
  'Japan': 18,
  'Senegal': 19,
  'Austria': 20,
  'Denmark': 21,
  'South Korea': 22,
  'Ecuador': 23,
  'Australia': 24,
  'Wales': 25,
  'Serbia': 26,
  'Iran': 27,
  'Poland': 28,
  'Scotland': 29,
  'Egypt': 31,
  'Norway': 32,
  'Algeria': 33,
  'Tunisia': 34,
  'Turkey': 38,
  'Saudi Arabia': 56,
  'Nigeria': 40,
  'Canada': 41,
  'Czechia': 43,
  'Jordan': 68,
  'Panama': 48,
  'Ivory Coast': 50,
  'Cape Verde': 69,
  'Bolivia': 79,
  'South Africa': 66,
  'Qatar': 37,
  'Ghana': 55,
  'Bosnia Herzegovina': 62,
  'Haiti': 84,
  'Jamaica': 61,
  'Paraguay': 53,
  'Uzbekistan': 74,
  'Curacao': 105,
  'New Zealand': 97,
};

// Recent form (last 5: W/D/L) — key qualifying/recent teams
type FormResult = 'W' | 'D' | 'L';
const TEAM_FORM: Record<string, FormResult[]> = {
  'Argentina': ['W', 'W', 'W', 'D', 'W'],
  'France': ['W', 'W', 'D', 'W', 'W'],
  'Spain': ['W', 'W', 'W', 'W', 'D'],
  'England': ['W', 'D', 'W', 'W', 'W'],
  'Brazil': ['D', 'W', 'L', 'W', 'W'],
  'Germany': ['W', 'W', 'W', 'D', 'W'],
  'Portugal': ['W', 'W', 'W', 'W', 'D'],
  'Netherlands': ['W', 'W', 'D', 'W', 'W'],
  'Belgium': ['W', 'D', 'W', 'W', 'L'],
  'Italy': ['W', 'W', 'D', 'W', 'W'],
  'USA': ['W', 'W', 'D', 'W', 'W'],
  'Mexico': ['W', 'D', 'W', 'W', 'D'],
  'Canada': ['W', 'W', 'W', 'D', 'W'],
  'Morocco': ['W', 'W', 'D', 'W', 'W'],
  'Japan': ['W', 'W', 'W', 'D', 'W'],
  'South Korea': ['W', 'D', 'W', 'W', 'D'],
  'Denmark': ['W', 'W', 'W', 'W', 'D'],
  'Switzerland': ['W', 'D', 'W', 'W', 'W'],
  'Serbia': ['W', 'D', 'W', 'L', 'W'],
  'Wales': ['W', 'D', 'L', 'W', 'D'],
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
  if (!homeTeam || !awayTeam ||
      homeTeam.includes('TBD') || awayTeam.includes('TBD') ||
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
      {/* Form row — only show if at least one team has form data */}
      {(homeForm || awayForm) && (
        <View style={styles.formRow}>
          <View style={styles.formSide}>
            <Text style={styles.teamCode}>{homeTeam.slice(0, 3).toUpperCase()}</Text>
            {homeForm ? (
              <View style={styles.formDots}>
                {homeForm.map((r, i) => (
                  <View key={i} style={[styles.formDot, { backgroundColor: FORM_COLORS[r] }]}>
                    <Text style={styles.formLetter}>{r}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.formNone}>—</Text>
            )}
          </View>
          <Text style={styles.formLabel}>Form</Text>
          <View style={[styles.formSide, styles.formSideRight]}>
            {awayForm ? (
              <View style={styles.formDots}>
                {awayForm.map((r, i) => (
                  <View key={i} style={[styles.formDot, { backgroundColor: FORM_COLORS[r] }]}>
                    <Text style={styles.formLetter}>{r}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.formNone}>—</Text>
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
  formNone: { color: Colors.textMuted, fontSize: Typography.xs, paddingHorizontal: 4 },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  oddsLabel: { color: Colors.textMuted, fontSize: Typography.xs, flex: 1 },
  oddsValues: { flexDirection: 'row', gap: Spacing.md },
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
