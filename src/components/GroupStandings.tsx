import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import type { Match, Team, GroupStanding } from '@/types';

// ── Pre-tournament reference data ────────────────────────────────────────────
// FIFA Rankings (Jan 2025 approximation) for all WC 2026 teams.
const FIFA_RANK: Record<string, number> = {
  Argentina: 1, France: 2, Spain: 3, England: 4, Brazil: 5, Belgium: 6, Portugal: 7,
  Netherlands: 8, Germany: 9, Italy: 10, USA: 11, Croatia: 12, Morocco: 13, Uruguay: 14,
  Mexico: 15, Colombia: 16, Switzerland: 17, Japan: 18, Senegal: 19, Austria: 20,
  Denmark: 21, 'South Korea': 22, Ecuador: 23, Australia: 24, Wales: 25, Iran: 27,
  Poland: 28, Scotland: 29, Egypt: 31, Norway: 32, Algeria: 33, Tunisia: 34, 'Qatar': 37,
  Turkey: 38, Nigeria: 40, Canada: 41, Czechia: 43, 'Panama': 48, 'Ivory Coast': 50,
  Paraguay: 53, Ghana: 55, 'Saudi Arabia': 56, 'Bosnia Herzegovina': 62, Jamaica: 61,
  'South Africa': 66, Jordan: 68, 'Cape Verde': 69, Uzbekistan: 74, Bolivia: 79, Haiti: 84,
  'New Zealand': 97, 'Curacao': 105, Iraq: 58, 'Congo DR': 60, 'Sweden': 26,
};

// Last World Cup appearance + finish. "—" means never.
// W = winners, F = final, SF = semi-final, QF = quarter-final, R16, GS = group stage.
const LAST_WC: Record<string, string> = {
  Argentina: '2022 W', France: '2022 F', England: '2022 QF', Spain: '2022 R16',
  Brazil: '2022 QF', Belgium: '2022 GS', Portugal: '2022 QF', Netherlands: '2022 QF',
  Germany: '2022 GS', USA: '2022 R16', Croatia: '2022 3rd', Morocco: '2022 4th',
  Uruguay: '2022 GS', Mexico: '2022 GS', Switzerland: '2022 R16', Japan: '2022 R16',
  Senegal: '2022 R16', Denmark: '2022 GS', 'South Korea': '2022 R16', Ecuador: '2022 GS',
  Australia: '2022 R16', Wales: '2022 GS', Iran: '2022 GS', Poland: '2022 R16',
  Tunisia: '2022 GS', 'Saudi Arabia': '2022 GS', Canada: '2022 GS', 'Qatar': '2022 GS',
  Ghana: '2022 GS', Cameroon: '2022 GS', Italy: '2014 GS', Egypt: '2018 GS',
  Norway: '1998 R16', Algeria: '2014 R16', Turkey: '2002 3rd', Nigeria: '2018 GS',
  Czechia: '2006 GS', Panama: '2018 GS', 'Ivory Coast': '2014 GS', Paraguay: '2010 QF',
  'Bosnia Herzegovina': '2014 GS', Jamaica: '1998 GS', 'South Africa': '2010 GS',
  Bolivia: '1994 GS', Haiti: '1974 GS', 'New Zealand': '2010 GS', Iraq: '1986 GS',
  'Congo DR': '1974 GS', 'Sweden': '2018 QF', 'Scotland': '1998 GS',
  Austria: '1998 GS', Colombia: '2018 R16',
  // Debut nations:
  Jordan: 'Debut', 'Cape Verde': 'Debut', Uzbekistan: 'Debut', 'Curacao': 'Debut',
};

interface Props {
  matches: Match[];
  teams: Team[];
}

export function GroupStandings({ matches, teams }: Props) {
  const groups = computeStandings(matches, teams);
  const groupKeys = Object.keys(groups).sort();

  // Pre-tournament: no matches yet finished → show FIFA Rank + Last WC instead of P/W/D/L/GD/Pts.
  const isPreTournament = !matches.some((m) => m.status === 'finished');

  if (groupKeys.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No teams found</Text>
      </View>
    );
  }

  return (
    <View>
      {groupKeys.map((groupName) => {
        // Pre-tournament: re-sort each group by FIFA rank (lower = better) so the
        // strongest team in each group shows first.
        const teamsInGroup = isPreTournament
          ? [...groups[groupName]].sort((a, b) =>
              (FIFA_RANK[a.team.name] ?? 999) - (FIFA_RANK[b.team.name] ?? 999))
          : groups[groupName];

        return (
          <View key={groupName} style={styles.groupCard}>
            <Text style={styles.groupTitle}>Group {groupName}</Text>

            {/* Header row */}
            <View style={styles.tableHeader}>
              <View style={styles.rankGutter} />
              <Text style={[styles.headerCell, styles.teamHeaderCell]}>Team</Text>
              {isPreTournament ? (
                <>
                  <Text style={[styles.headerCell, styles.fifaHeaderCell]}>FIFA</Text>
                  <Text style={[styles.headerCell, styles.lastWcHeaderCell]}>Last WC</Text>
                </>
              ) : (
                <>
                  <Text style={styles.headerCell}>P</Text>
                  <Text style={styles.headerCell}>W</Text>
                  <Text style={styles.headerCell}>D</Text>
                  <Text style={styles.headerCell}>L</Text>
                  <Text style={styles.headerCell}>GD</Text>
                  <Text style={[styles.headerCell, styles.ptsHeaderCell]}>Pts</Text>
                </>
              )}
            </View>

            {teamsInGroup.map((standing, idx) => {
              const rowBg = !isPreTournament && (
                idx < 2  ? 'rgba(34, 197, 94, 0.08)' :
                idx === 2 ? 'rgba(245, 158, 11, 0.08)' :
                undefined
              );
              const fifa = FIFA_RANK[standing.team.name];
              const lastWc = LAST_WC[standing.team.name] ?? '—';

              return (
                <View
                  key={standing.team.id}
                  style={[
                    styles.row,
                    idx < teamsInGroup.length - 1 && styles.rowBorder,
                    rowBg ? { backgroundColor: rowBg } : undefined,
                  ]}
                >
                  <View style={styles.rankGutter}>
                    <Text style={styles.rank}>{idx + 1}</Text>
                  </View>

                  <View style={styles.teamCell}>
                    <Image
                      source={{ uri: standing.team.flag_url ?? undefined }}
                      style={styles.flag}
                      resizeMode="contain"
                    />
                    <Text style={styles.teamName} numberOfLines={1}>{standing.team.name}</Text>
                  </View>

                  {isPreTournament ? (
                    <>
                      <Text style={[styles.cell, styles.fifaCell]}>
                        {fifa ? `#${fifa}` : '—'}
                      </Text>
                      <Text style={[styles.cell, styles.lastWcCell]}>{lastWc}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.cell}>{standing.played}</Text>
                      <Text style={styles.cell}>{standing.won}</Text>
                      <Text style={styles.cell}>{standing.drawn}</Text>
                      <Text style={styles.cell}>{standing.lost}</Text>
                      <Text style={styles.cell}>
                        {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
                      </Text>
                      <Text style={[styles.cell, styles.ptsCell]}>{standing.points}</Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
      <Text style={styles.qualifier}>
        {isPreTournament
          ? 'Sorted by FIFA rank · Top 2 per group + best 8 third-place advance'
          : 'Top 2 per group + best 8 third-place advance'}
      </Text>
    </View>
  );
}

function computeStandings(matches: Match[], teams: Team[]): Record<string, GroupStanding[]> {
  const standings: Record<string, Record<string, GroupStanding>> = {};

  for (const team of teams) {
    if (!team.group_name) continue;
    if (!standings[team.group_name]) standings[team.group_name] = {};
    standings[team.group_name][team.id] = {
      team,
      played: 0, won: 0, drawn: 0, lost: 0,
      goals_for: 0, goals_against: 0,
      goal_difference: 0, points: 0,
    };
  }

  for (const match of matches) {
    if (match.status !== 'finished' || match.home_score == null || match.away_score == null) continue;
    const group = match.home_team?.group_name;
    if (!group || !standings[group]) continue;

    const home = match.home_team_id ? standings[group][match.home_team_id] : undefined;
    const away = match.away_team_id ? standings[group][match.away_team_id] : undefined;
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goals_for += match.home_score; home.goals_against += match.away_score;
    away.goals_for += match.away_score; away.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      home.won++; home.points += 3; away.lost++;
    } else if (match.home_score < match.away_score) {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.drawn++; home.points += 1; away.drawn++; away.points += 1;
    }
  }

  const result: Record<string, GroupStanding[]> = {};
  for (const [group, ts] of Object.entries(standings)) {
    result[group] = Object.values(ts)
      .map((s) => ({ ...s, goal_difference: s.goals_for - s.goals_against }))
      .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
  }
  return result;
}

const COL = scale(28);

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: '800',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankGutter: {
    width: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamHeaderCell: {
    flex: 1,
    textAlign: 'left',
    width: undefined,
  },
  headerCell: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
    width: COL,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  ptsHeaderCell: {
    color: Colors.primary,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xs,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  teamCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  flag: {
    width: scale(28),
    height: scale(20),
    borderRadius: 3,
  },
  teamName: {
    color: Colors.text,
    fontSize: Typography.xs,
    fontWeight: '600',
    flex: 1,
  },
  cell: {
    color: Colors.text,
    fontSize: Typography.xs,
    width: COL,
    textAlign: 'center',
  },
  ptsCell: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: Typography.sm,
  },
  fifaHeaderCell: {
    width: scale(46),
  },
  lastWcHeaderCell: {
    width: scale(78),
  },
  fifaCell: {
    width: scale(46),
    color: Colors.primary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lastWcCell: {
    width: scale(78),
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: Typography.xs,
  },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm },
  qualifier: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
