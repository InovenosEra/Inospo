import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import type { Match, Team, GroupStanding } from '@/types';

interface Props {
  matches: Match[];
  teams: Team[];
}

export function GroupStandings({ matches, teams }: Props) {
  const groups = computeStandings(matches, teams);
  const groupKeys = Object.keys(groups).sort();

  if (groupKeys.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No teams found</Text>
      </View>
    );
  }

  return (
    <View>
      {groupKeys.map((groupName) => (
        <View key={groupName} style={styles.groupCard}>
          <Text style={styles.groupTitle}>Group {groupName}</Text>

          {/* Header row */}
          <View style={styles.tableHeader}>
            {/* left gutter: dot + rank + flag space */}
            <View style={styles.rankGutter} />
            <Text style={[styles.headerCell, styles.teamHeaderCell]}>Team</Text>
            <Text style={styles.headerCell}>P</Text>
            <Text style={styles.headerCell}>W</Text>
            <Text style={styles.headerCell}>D</Text>
            <Text style={styles.headerCell}>L</Text>
            <Text style={styles.headerCell}>GD</Text>
            <Text style={[styles.headerCell, styles.ptsHeaderCell]}>Pts</Text>
          </View>

          {groups[groupName].map((standing, idx) => {
            const rowBg =
              idx < 2  ? 'rgba(34, 197, 94, 0.08)' :
              idx === 2 ? 'rgba(245, 158, 11, 0.08)' :
              undefined;

            return (
              <View
                key={standing.team.id}
                style={[styles.row, idx < groups[groupName].length - 1 && styles.rowBorder, rowBg ? { backgroundColor: rowBg } : undefined]}
              >
                {/* Rank */}
                <View style={styles.rankGutter}>
                  <Text style={styles.rank}>{idx + 1}</Text>
                </View>

                {/* Flag + name */}
                <View style={styles.teamCell}>
                  <Image
                    source={{ uri: standing.team.flag_url ?? undefined }}
                    style={styles.flag}
                    resizeMode="contain"
                  />
                  <Text style={styles.teamName} numberOfLines={1}>{standing.team.name}</Text>
                </View>

                <Text style={styles.cell}>{standing.played}</Text>
                <Text style={styles.cell}>{standing.won}</Text>
                <Text style={styles.cell}>{standing.drawn}</Text>
                <Text style={styles.cell}>{standing.lost}</Text>
                <Text style={styles.cell}>
                  {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
                </Text>
                <Text style={[styles.cell, styles.ptsCell]}>{standing.points}</Text>
              </View>
            );
          })}
        </View>
      ))}
      <Text style={styles.qualifier}>Top 2 per group + best 8 third-place advance</Text>
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
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm },
  qualifier: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
