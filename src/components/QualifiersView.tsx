import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { scale } from '@/utils/responsive';

// ── Types ─────────────────────────────────────────────────────────────────────

type FormResult = 'W' | 'D' | 'L';

interface PlayoffTeam {
  name: string;
  code: string;
  flag: string;
  form: FormResult[];
}

interface PlayoffMatch {
  date: string;
  venue?: string;
  home: PlayoffTeam;
  away: PlayoffTeam;
  homeWin: number;
  draw: number;
  awayWin: number;
}

// ── Static playoff data ───────────────────────────────────────────────────────

const UEFA_PATHS: Array<{ path: string; matches: PlayoffMatch[]; finalDate: string }> = [
  {
    path: 'A',
    finalDate: 'Mar 31',
    matches: [
      {
        date: '2026-03-26T20:45:00',
        home: { name: 'Wales',            code: 'WAL', flag: 'https://flagcdn.com/w40/gb-wls.png', form: ['W','D','L','W','D'] },
        away: { name: 'Bosnia & Herz.',   code: 'BIH', flag: 'https://flagcdn.com/w40/ba.png',     form: ['W','L','D','W','L'] },
        homeWin: 81, draw: 9,  awayWin: 10,
      },
      {
        date: '2026-03-26T20:45:00',
        home: { name: 'Italy',            code: 'ITA', flag: 'https://flagcdn.com/w40/it.png',     form: ['W','W','D','W','W'] },
        away: { name: 'N. Ireland',       code: 'NIR', flag: 'https://flagcdn.com/w40/gb-nir.png', form: ['L','L','D','L','L'] },
        homeWin: 85, draw: 5,  awayWin: 10,
      },
    ],
  },
  {
    path: 'B',
    finalDate: 'Mar 31',
    matches: [
      {
        date: '2026-03-26T20:45:00',
        home: { name: 'Poland',           code: 'POL', flag: 'https://flagcdn.com/w40/pl.png',     form: ['W','W','D','L','W'] },
        away: { name: 'Albania',          code: 'ALB', flag: 'https://flagcdn.com/w40/al.png',     form: ['L','W','D','L','W'] },
        homeWin: 69, draw: 15, awayWin: 16,
      },
      {
        date: '2026-03-27T20:45:00',
        home: { name: 'Ukraine',          code: 'UKR', flag: 'https://flagcdn.com/w40/ua.png',     form: ['W','W','W','D','W'] },
        away: { name: 'Sweden',           code: 'SWE', flag: 'https://flagcdn.com/w40/se.png',     form: ['W','L','W','D','L'] },
        homeWin: 72, draw: 14, awayWin: 14,
      },
    ],
  },
  {
    path: 'C',
    finalDate: 'Mar 31',
    matches: [
      {
        date: '2026-03-26T20:45:00',
        home: { name: 'Slovakia',         code: 'SVK', flag: 'https://flagcdn.com/w40/sk.png',     form: ['W','D','W','W','L'] },
        away: { name: 'Kosovo',           code: 'KVX', flag: 'https://flagcdn.com/w40/xk.png',     form: ['W','L','W','D','L'] },
        homeWin: 83, draw: 7,  awayWin: 10,
      },
      {
        date: '2026-03-27T20:45:00',
        home: { name: 'Türkiye',          code: 'TUR', flag: 'https://flagcdn.com/w40/tr.png',     form: ['W','W','W','D','W'] },
        away: { name: 'Romania',          code: 'ROU', flag: 'https://flagcdn.com/w40/ro.png',     form: ['D','W','L','W','D'] },
        homeWin: 52, draw: 22, awayWin: 26,
      },
    ],
  },
  {
    path: 'D',
    finalDate: 'Mar 31',
    matches: [
      {
        date: '2026-03-26T20:45:00',
        home: { name: 'Czech Republic',   code: 'CZE', flag: 'https://flagcdn.com/w40/cz.png',     form: ['D','W','W','L','W'] },
        away: { name: 'Rep. Ireland',     code: 'IRL', flag: 'https://flagcdn.com/w40/ie.png',     form: ['W','D','L','W','D'] },
        homeWin: 64, draw: 22, awayWin: 14,
      },
      {
        date: '2026-03-27T20:45:00',
        home: { name: 'Denmark',          code: 'DEN', flag: 'https://flagcdn.com/w40/dk.png',     form: ['W','W','W','W','D'] },
        away: { name: 'North Macedonia',  code: 'MKD', flag: 'https://flagcdn.com/w40/mk.png',     form: ['L','D','L','W','L'] },
        homeWin: 81, draw: 9,  awayWin: 10,
      },
    ],
  },
];

const INTER_PATHS: Array<{ pathway: number; matches: PlayoffMatch[]; finalDate: string }> = [
  {
    pathway: 1,
    finalDate: 'Mar 31',
    matches: [
      {
        date: '2026-03-26T18:00:00',
        venue: 'Estadio BBVA, Monterrey',
        home: { name: 'New Caledonia',    code: 'NCL', flag: 'https://flagcdn.com/w40/nc.png',     form: ['W','W','L','W','D'] },
        away: { name: 'Jamaica',          code: 'JAM', flag: 'https://flagcdn.com/w40/jm.png',     form: ['D','W','L','D','W'] },
        homeWin: 15, draw: 22, awayWin: 63,
      },
    ],
  },
  {
    pathway: 2,
    finalDate: 'Mar 31',
    matches: [
      {
        date: '2026-03-26T21:00:00',
        venue: 'Estadio Akron, Guadalajara',
        home: { name: 'Bolivia',          code: 'BOL', flag: 'https://flagcdn.com/w40/bo.png',     form: ['L','D','L','W','L'] },
        away: { name: 'Suriname',         code: 'SUR', flag: 'https://flagcdn.com/w40/sr.png',     form: ['W','D','L','W','D'] },
        homeWin: 82, draw: 8,  awayWin: 10,
      },
    ],
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export function QualifiersView() {
  return (
    <View style={styles.container}>

      {/* ── Header card ─────────────────────────────────────────────────────── */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerFlagIcon}>🚩</Text>
            <Text style={styles.headerTitle}>Remaining Qualification</Text>
          </View>
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>Playoffs Active</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Qualified Teams</Text>
            <Text style={styles.progressCount}>
              <Text style={styles.progressCountBold}>42</Text>{' / 48'}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '87.5%' }]} />
          </View>
          <Text style={styles.progressNote}>
            6 spots remaining via playoffs (4 UEFA + 2 Intercontinental)
          </Text>
        </View>
      </View>

      {/* ── UEFA European Playoffs ──────────────────────────────────────────── */}
      <View style={styles.sectionHeaderCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>UEFA European Playoffs</Text>
          <View style={styles.qualBadge}>
            <Text style={styles.qualBadgeText}>4 qualifiers</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>16 teams competing for 4 World Cup spots</Text>
      </View>

      {UEFA_PATHS.map((p) => (
        <View key={p.path} style={styles.pathCard}>
          <View style={styles.pathHeaderRow}>
            <Text style={styles.pathLabel}>Path {p.path}</Text>
            <View style={styles.sfDivider}>
              <View style={styles.sfLine} />
              <Text style={styles.sfText}>Semi-final</Text>
              <View style={styles.sfLine} />
            </View>
          </View>

          {p.matches.map((match, idx) => (
            <MatchCard key={idx} match={match} isLast={idx === p.matches.length - 1} />
          ))}

          <View style={styles.finalRow}>
            <Text style={styles.finalArrow}>→</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.finalLabel}>Final</Text>
              <Text style={styles.finalDate}>{p.finalDate} · Winner vs Winner</Text>
            </View>
            <View style={styles.tbdBadge}>
              <Text style={styles.tbdText}>TBD</Text>
            </View>
          </View>
        </View>
      ))}

      {/* ── Intercontinental Playoffs ────────────────────────────────────────── */}
      <View style={[styles.sectionHeaderCard, styles.sectionHeaderCardInter]}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Intercontinental Playoffs</Text>
          <View style={styles.qualBadge}>
            <Text style={styles.qualBadgeText}>2 qualifiers</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>Hosted in Mexico (Monterrey & Guadalajara)</Text>
      </View>

      {INTER_PATHS.map((p) => (
        <View key={p.pathway} style={styles.pathCard}>
          <View style={styles.pathHeaderRow}>
            <Text style={styles.pathLabel}>Pathway {p.pathway}</Text>
            <View style={styles.sfDivider}>
              <View style={styles.sfLine} />
              <Text style={styles.sfText}>Semi-final</Text>
              <View style={styles.sfLine} />
            </View>
          </View>

          {p.matches.map((match, idx) => (
            <MatchCard key={idx} match={match} isLast={true} />
          ))}

          <View style={styles.finalRow}>
            <Text style={styles.finalArrow}>→</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.finalLabel}>Final</Text>
              <Text style={styles.finalDate}>{p.finalDate} · Winner qualifies</Text>
            </View>
            <View style={styles.tbdBadge}>
              <Text style={styles.tbdText}>TBD</Text>
            </View>
          </View>
        </View>
      ))}

    </View>
  );
}

// ── FormBubble ────────────────────────────────────────────────────────────────

function FormBubble({ result }: { result: FormResult }) {
  const bg =
    result === 'W' ? Colors.accent :
    result === 'D' ? Colors.draw :
    Colors.live;
  const color = result === 'D' ? '#1a1a1a' : '#fff';
  return (
    <View style={[styles.bubble, { backgroundColor: bg }]}>
      <Text style={[styles.bubbleText, { color }]}>{result}</Text>
    </View>
  );
}

// ── MatchCard ─────────────────────────────────────────────────────────────────

function MatchCard({ match, isLast }: { match: PlayoffMatch; isLast: boolean }) {
  const d = new Date(match.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View style={[styles.matchCard, !isLast && styles.matchCardBorder]}>
      {/* Date / venue */}
      <View style={styles.matchMeta}>
        <Text style={styles.matchMetaText}>📅 {dateStr} · {timeStr}</Text>
        {match.venue ? <Text style={styles.matchMetaText}>📍 {match.venue}</Text> : null}
      </View>

      {/* Home team row */}
      <View style={styles.teamRow}>
        <View style={styles.teamLeft}>
          <Image source={{ uri: match.home.flag }} style={styles.teamFlag} resizeMode="contain" />
          <Text style={styles.teamName} numberOfLines={1}>{match.home.name}</Text>
        </View>
        <View style={styles.teamRight}>
          <Text style={styles.teamCode}>{match.home.code}</Text>
          {match.home.form.map((r, i) => <FormBubble key={i} result={r} />)}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.teamDivider} />

      {/* Away team row */}
      <View style={styles.teamRow}>
        <View style={styles.teamLeft}>
          <Image source={{ uri: match.away.flag }} style={styles.teamFlag} resizeMode="contain" />
          <Text style={styles.teamName} numberOfLines={1}>{match.away.name}</Text>
        </View>
        <View style={styles.teamRight}>
          <Text style={styles.teamCode}>{match.away.code}</Text>
          {match.away.form.map((r, i) => <FormBubble key={i} result={r} />)}
        </View>
      </View>

      {/* Win probability */}
      <View style={styles.winSection}>
        <Text style={styles.winTitle}>WIN PROBABILITY</Text>
        <View style={styles.winBarOuter}>
          <View style={{ flex: match.homeWin, backgroundColor: Colors.primary }} />
          <View style={{ flex: match.draw,    backgroundColor: Colors.borderLight }} />
          <View style={{ flex: match.awayWin, backgroundColor: Colors.accent }} />
        </View>
        <View style={styles.winLabels}>
          <Text style={[styles.winLabelText, { color: Colors.primary }]}>Home {match.homeWin}%</Text>
          <Text style={[styles.winLabelText, { color: Colors.textMuted }]}>Draw {match.draw}%</Text>
          <Text style={[styles.winLabelText, { color: Colors.accent }]}>Away {match.awayWin}%</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },

  // ── Header card ──────────────────────────────────────────────────────────────
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerFlagIcon: { fontSize: 14 },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentDim,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  activePillText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '600',
  },

  progressBlock: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  progressCount: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  progressCountBold: {
    color: Colors.accent,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  progressNote: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },

  // ── Section header card ───────────────────────────────────────────────────────
  sectionHeaderCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionHeaderCardInter: {
    marginTop: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  qualBadge: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  qualBadgeText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },

  // ── Path card ─────────────────────────────────────────────────────────────────
  pathCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pathHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  pathLabel: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: scale(46),
  },
  sfDivider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sfLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sfText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── Match card (inside path card) ─────────────────────────────────────────────
  matchCard: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  matchCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  matchMetaText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },

  // Team rows
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  teamLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  teamFlag: {
    width: scale(22),
    height: scale(16),
    borderRadius: 2,
  },
  teamName: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  teamRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: Spacing.sm,
  },
  teamCode: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginRight: 2,
    minWidth: scale(24),
    textAlign: 'right',
  },
  teamDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 1,
  },

  // Form bubbles
  bubble: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 8,
    fontWeight: '800',
  },

  // Win probability
  winSection: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  winTitle: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  winBarOuter: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  winLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  winLabelText: {
    fontSize: 9,
    fontWeight: '600',
  },

  // Final row
  finalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  finalArrow: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  finalLabel: {
    color: Colors.text,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  finalDate: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  tbdBadge: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tbdText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
});
