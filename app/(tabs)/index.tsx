import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMatches } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { MatchCard } from '@/components/MatchCard';
import { AuthModal } from '@/components/AuthModal';
import { PredictionModal } from '@/components/PredictionModal';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { Match, MatchFilter } from '@/types';

const FILTERS: Array<{ key: MatchFilter; label: string; dot?: boolean }> = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live', dot: true },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, profile } = useAuth();
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const { data: matches = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 30 * 1000,
  });

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'live') return m.status === 'live';
    if (filter === 'upcoming') return m.status === 'scheduled';
    if (filter === 'completed') return m.status === 'finished';
    return true;
  });

  const handlePredictPress = useCallback((match: Match) => {
    if (!isAuthenticated) {
      setShowAuth(true);
    } else {
      setSelectedMatch(match);
    }
  }, [isAuthenticated]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ World Cup 2026</Text>
        <Text style={styles.headerSubtitle}>FIFA · USA · Canada · Mexico</Text>
      </View>

      {/* Filters — fixed row, all 4 tabs always visible */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            {f.dot && (
              <View style={[styles.liveDot, filter === f.key && styles.liveDotActive]} />
            )}
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Match List */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPredictPress={() => handlePredictPress(item)}
            userId={profile?.id}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No matches found</Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} />
      {selectedMatch && (
        <PredictionModal
          match={selectedMatch}
          userId={profile?.id ?? ''}
          visible={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
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
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Fixed-width row — all tabs share equal space, never resize
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.cardElevated,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  filterLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.primary,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  liveDotActive: {
    backgroundColor: Colors.live,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
  },
});
