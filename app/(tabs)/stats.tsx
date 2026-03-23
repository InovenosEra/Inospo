import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMatches, fetchTeams, fetchTopScorers, fetchTopAssists } from '@/lib/api';
import { GroupStandings } from '@/components/GroupStandings';
import { KnockoutBracket } from '@/components/KnockoutBracket';
import { TopScorersList } from '@/components/TopScorersList';
import { QualifiersView } from '@/components/QualifiersView';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { StatsView } from '@/types';

const VIEWS: Array<{ key: StatsView; icon: string; label: string }> = [
  { key: 'qualifiers', icon: '🚩', label: 'Qualifiers' },
  { key: 'standings', icon: '👥', label: 'Groups' },
  { key: 'bracket',   icon: '🏆', label: 'Knockout' },
  { key: 'scorers',   icon: '👤', label: 'Stats' },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [activeView, setActiveView] = useState<StatsView>('qualifiers');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: assists = [] } = useQuery({
    queryKey: ['top-assists'],
    queryFn: fetchTopAssists,
    enabled: activeView === 'scorers',
  });

  // API is "live" when we have real scorer data with goals > 0
  const apiConnected = scorers.length > 0 && scorers.some((s) => s.goals > 0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📊</Text>
          <Text style={styles.headerTitle}>Stats & Standings</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusPill, apiConnected && styles.statusPillLive]}>
            <View style={[styles.statusDot, apiConnected && styles.statusDotLive]} />
            <Text style={[styles.statusText, apiConnected && styles.statusTextLive]}>
              {apiConnected ? 'Live' : 'Pre-Season'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
            <Text style={[styles.refreshIcon, refreshing && { opacity: 0.4 }]}>↻</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.navIcon}>{v.icon}</Text>
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
        {activeView === 'standings'  && <GroupStandings matches={matches} teams={teams} />}
        {activeView === 'bracket'    && <KnockoutBracket matches={matches} />}
        {activeView === 'scorers'    && (
          <TopScorersList scorers={scorers} assists={assists} apiConnected={apiConnected} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: { fontSize: 18 },
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
  },
  statusPillLive: {
    backgroundColor: Colors.accentDim,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  statusDotLive: {
    backgroundColor: Colors.accent,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  statusTextLive: {
    color: Colors.accent,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refreshIcon: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  // ── Nav ─────────────────────────────────────────────────────────────────────
  navScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  navContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
  },
  navTabActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  navIcon: { fontSize: 11 },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  navLabelActive: {
    color: Colors.primary,
  },
  // ── Content ─────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
