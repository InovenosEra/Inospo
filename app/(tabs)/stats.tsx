import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchMatches, fetchTeams, fetchTopScorers } from '@/lib/api';
import { GroupStandings } from '@/components/GroupStandings';
import { KnockoutBracket } from '@/components/KnockoutBracket';
import { TopScorersList } from '@/components/TopScorersList';
import { QualifiersView } from '@/components/QualifiersView';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { StatsView } from '@/types';

const VIEWS: Array<{ key: StatsView; label: string }> = [
  { key: 'qualifiers', label: 'Qualifiers' },
  { key: 'standings', label: 'Standings' },
  { key: 'bracket', label: 'Bracket' },
  { key: 'scorers', label: 'Scorers' },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [activeView, setActiveView] = useState<StatsView>('standings');

  const { data: matches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const { data: scorers = [] } = useQuery({
    queryKey: ['top-scorers'],
    queryFn: fetchTopScorers,
    enabled: activeView === 'scorers',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
      </View>

      {/* Sub-navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navScrollView}
        contentContainerStyle={styles.navContainer}
      >
        {VIEWS.map((v) => (
          <TouchableOpacity
            key={v.key}
            style={[styles.navTab, activeView === v.key && styles.navTabActive]}
            onPress={() => setActiveView(v.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.navLabel, activeView === v.key && styles.navLabelActive]}>
              {v.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {activeView === 'qualifiers' && <QualifiersView />}
        {activeView === 'standings' && <GroupStandings matches={matches} teams={teams} />}
        {activeView === 'bracket' && <KnockoutBracket matches={matches} />}
        {activeView === 'scorers' && <TopScorersList scorers={scorers} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  navScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  navContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  navTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  navTabActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  navLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  navLabelActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
