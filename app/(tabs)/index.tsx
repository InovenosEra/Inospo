import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import type { Match } from '@/types';

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, profile } = useAuth();
  const [liveOnly, setLiveOnly] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const hasScrolled = useRef(false);

  const { data: matches = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 30 * 1000,
  });

  // Sort all matches chronologically
  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()),
    [matches]
  );

  const displayMatches = liveOnly
    ? sortedMatches.filter((m) => m.status === 'live')
    : sortedMatches;

  // Index of the first upcoming (scheduled) match
  const nextMatchIndex = useMemo(
    () => displayMatches.findIndex((m) => m.status === 'scheduled'),
    [displayMatches]
  );

  // Scroll to next match once on initial load
  useEffect(() => {
    if (!liveOnly && nextMatchIndex > 0 && !hasScrolled.current && displayMatches.length > 0) {
      hasScrolled.current = true;
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: nextMatchIndex,
          animated: false,
          viewPosition: 0,
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [nextMatchIndex, liveOnly, displayMatches.length]);

  // Reset scroll flag when switching to live mode and back
  useEffect(() => {
    if (!liveOnly) hasScrolled.current = false;
  }, [liveOnly]);

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
        <View>
          <Text style={styles.headerTitle}>⚽ World Cup 2026</Text>
          <Text style={styles.headerSubtitle}>FIFA · USA · Canada · Mexico</Text>
        </View>

        {/* Live toggle */}
        <TouchableOpacity
          style={[styles.liveToggle, liveOnly && styles.liveToggleActive]}
          onPress={() => setLiveOnly(!liveOnly)}
          activeOpacity={0.9}
        >
          {!liveOnly && <View style={styles.liveThumbOff} />}
          <Text style={[styles.liveToggleText, liveOnly && styles.liveToggleTextActive]}>LIVE</Text>
          {liveOnly && <View style={styles.liveThumbOn} />}
        </TouchableOpacity>
      </View>

      {/* Match List */}
      <FlatList
        ref={flatListRef}
        data={displayMatches}
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
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 300);
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {liveOnly ? 'No live matches right now' : 'No matches found'}
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  liveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.cardElevated,
    minWidth: 72,
  },
  liveToggleActive: {
    backgroundColor: Colors.live,
    borderColor: Colors.live,
  },
  liveThumbOff: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.textMuted,
  },
  liveThumbOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.text,
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
  liveToggleText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  liveToggleTextActive: {
    color: Colors.text,
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
