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

  // Always show all groups even with 0 points — tournament hasn't started yet
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
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1 }]}>Team</Text>
            <Text style={styles.headerCell}>P</Text>
            <Text style={[styles.headerCell, styles.faCell]}>F:A</Text>
            <Text style={styles.headerCell}>GD</Text>
            <Text style={[styles.headerCell, styles.ptsCell]}>Pts</Text>
          </View>
          {groups[groupName].map((standing, idx) => (
            <View key={standing.team.id} style={[styles.row, idx < 2 && styles.rowQualified]}>
              <View style={[styles.cell, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Image source={{ uri: standing.team.flag_url ?? undefined }} style={styles.flag} resizeMode="contain" />
                <Text style={styles.teamName} numberOfLines={1}>{standing.team.name}</Text>
              </View>
              <Text style={styles.cell}>{standing.played}</Text>
              <Text style={[styles.cell, styles.faCell]}>
                {standing.goals_for}:{standing.goals_against}
              </Text>
              <Text style={[styles.cell, standing.goal_difference > 0 && styles.positive, standing.goal_difference < 0 && styles.negative]}>
                {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
              </Text>
              <Text style={[styles.cell, styles.ptsCell, styles.ptsText]}>{standing.points}</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={styles.qualifier}>Top 2 per group advance to Round of 32</Text>
    </View>
  );
}

function computeStandings(matches: Match[], teams: Team[]): Record<string, GroupStanding[]> {
  const standings: Record<string, Record<string, GroupStanding>> = {};

  // Initialize
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

  // Calculate from finished matches
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

  // Sort each group
  const result: Record<string, GroupStanding[]> = {};
  for (const [group, teams] of Object.entries(standings)) {
    result[group] = Object.values(teams)
      .map((s) => ({ ...s, goal_difference: s.goals_for - s.goals_against }))
      .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
  }
  return result;
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: '800',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  headerCell: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    width: scale(28),
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  rowQualified: {
    backgroundColor: Colors.accentDim,
  },
  cell: {
    color: Colors.text,
    fontSize: Typography.xs,
    width: scale(28),
    textAlign: 'center',
  },
  faCell: { width: scale(36) },
  ptsCell: { width: scale(32) },
  ptsText: { color: Colors.primary, fontWeight: '800' },
  positive: { color: Colors.accent },
  negative: { color: Colors.live },
  flag: { width: scale(22), height: scale(16), borderRadius: 2 },
  teamName: { color: Colors.text, fontSize: Typography.xs, fontWeight: '600', flex: 1 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center' },
  qualifier: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
