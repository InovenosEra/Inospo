import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchMatches } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { MatchCard } from '@/components/MatchCard';
import { AuthModal } from '@/components/AuthModal';
import { PredictionModal } from '@/components/PredictionModal';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import type { Match } from '@/types';

// ── Static qualification playoff fixtures ─────────────────────────────────────

interface PlayoffFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  venue: string;
  stage: string;
  round: string;
}

const PLAYOFF_FIXTURES: PlayoffFixture[] = [
  // UEFA Path A
  { id: 'wal-bih', homeTeam: 'Wales',          awayTeam: 'Bosnia & Herz.', homeFlag: 'https://flagcdn.com/w40/gb-wls.png', awayFlag: 'https://flagcdn.com/w40/ba.png', date: '2026-03-26T20:45:00', venue: 'Cardiff City Stadium', stage: 'UEFA Playoffs',           round: 'Path A · Semi-final' },
  { id: 'ita-nir', homeTeam: 'Italy',           awayTeam: 'N. Ireland',     homeFlag: 'https://flagcdn.com/w40/it.png',     awayFlag: 'https://flagcdn.com/w40/gb-nir.png', date: '2026-03-26T20:45:00', venue: 'Stadio Olimpico, Rome', stage: 'UEFA Playoffs',      round: 'Path A · Semi-final' },
  // UEFA Path B
  { id: 'pol-alb', homeTeam: 'Poland',          awayTeam: 'Albania',        homeFlag: 'https://flagcdn.com/w40/pl.png',     awayFlag: 'https://flagcdn.com/w40/al.png', date: '2026-03-26T20:45:00', venue: 'PGE Narodowy, Warsaw',  stage: 'UEFA Playoffs',          round: 'Path B · Semi-final' },
  { id: 'ukr-swe', homeTeam: 'Ukraine',         awayTeam: 'Sweden',         homeFlag: 'https://flagcdn.com/w40/ua.png',     awayFlag: 'https://flagcdn.com/w40/se.png', date: '2026-03-27T20:45:00', venue: 'Vasyl Lobanovskyi Stadium', stage: 'UEFA Playoffs',    round: 'Path B · Semi-final' },
  // UEFA Path C
  { id: 'svk-kvx', homeTeam: 'Slovakia',        awayTeam: 'Kosovo',         homeFlag: 'https://flagcdn.com/w40/sk.png',     awayFlag: 'https://flagcdn.com/w40/xk.png', date: '2026-03-26T20:45:00', venue: 'Tehelné pole, Bratislava', stage: 'UEFA Playoffs',    round: 'Path C · Semi-final' },
  { id: 'tur-rou', homeTeam: 'Türkiye',         awayTeam: 'Romania',        homeFlag: 'https://flagcdn.com/w40/tr.png',     awayFlag: 'https://flagcdn.com/w40/ro.png', date: '2026-03-27T20:45:00', venue: 'Atatürk Olimpiyat, Istanbul', stage: 'UEFA Playoffs',  round: 'Path C · Semi-final' },
  // UEFA Path D
  { id: 'cze-irl', homeTeam: 'Czech Republic',  awayTeam: 'Rep. Ireland',   homeFlag: 'https://flagcdn.com/w40/cz.png',     awayFlag: 'https://flagcdn.com/w40/ie.png', date: '2026-03-26T20:45:00', venue: 'Letná, Prague',          stage: 'UEFA Playoffs',          round: 'Path D · Semi-final' },
  { id: 'den-mkd', homeTeam: 'Denmark',         awayTeam: 'N. Macedonia',   homeFlag: 'https://flagcdn.com/w40/dk.png',     awayFlag: 'https://flagcdn.com/w40/mk.png', date: '2026-03-27T20:45:00', venue: 'Parken, Copenhagen',     stage: 'UEFA Playoffs',          round: 'Path D · Semi-final' },
  // Intercontinental
  { id: 'ncl-jam', homeTeam: 'New Caledonia',   awayTeam: 'Jamaica',        homeFlag: 'https://flagcdn.com/w40/nc.png',     awayFlag: 'https://flagcdn.com/w40/jm.png', date: '2026-03-26T18:00:00', venue: 'Estadio BBVA, Monterrey',    stage: 'Intercontinental Playoffs', round: 'Pathway 1 · Semi-final' },
  { id: 'bol-sur', homeTeam: 'Bolivia',         awayTeam: 'Suriname',       homeFlag: 'https://flagcdn.com/w40/bo.png',     awayFlag: 'https://flagcdn.com/w40/sr.png', date: '2026-03-26T21:00:00', venue: 'Estadio Akron, Guadalajara', stage: 'Intercontinental Playoffs', round: 'Pathway 2 · Semi-final' },
];

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
        ListHeaderComponent={!liveOnly ? <PlayoffsSection fixtures={PLAYOFF_FIXTURES} /> : null}
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

// ── Playoffs section ─────────────────────────────────────────────────────────

function PlayoffsSection({ fixtures }: { fixtures: PlayoffFixture[] }) {
  return (
    <View>
      {/* Section label */}
      <View style={pStyles.sectionLabel}>
        <Text style={pStyles.sectionLabelText}>🚩 QUALIFICATION PLAYOFFS</Text>
      </View>

      {fixtures.map((f) => (
        <PlayoffMatchCard key={f.id} fixture={f} />
      ))}

      {/* Group stage section label */}
      <View style={pStyles.sectionLabel}>
        <Text style={pStyles.sectionLabelText}>⚽ GROUP STAGE</Text>
      </View>
    </View>
  );
}

function PlayoffMatchCard({ fixture }: { fixture: PlayoffFixture }) {
  const date = new Date(fixture.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View style={pStyles.card}>
      {/* Top row: date · time  |  round */}
      <View style={pStyles.topRow}>
        <Text style={pStyles.timeText}>{dateStr} · {timeStr}</Text>
        <Text style={pStyles.stageText}>{fixture.round.toUpperCase()}</Text>
      </View>

      {/* Teams row — matches MatchCard layout exactly */}
      <View style={pStyles.teamsRow}>
        <View style={pStyles.teamSide}>
          <Image source={{ uri: fixture.homeFlag }} style={pStyles.flag} resizeMode="cover" />
          <Text style={pStyles.teamName} numberOfLines={1}>{fixture.homeTeam}</Text>
        </View>

        <View style={pStyles.scoreBox}>
          <Text style={pStyles.vs}>VS</Text>
        </View>

        <View style={pStyles.teamSide}>
          <Image source={{ uri: fixture.awayFlag }} style={pStyles.flag} resizeMode="cover" />
          <Text style={pStyles.teamName} numberOfLines={1}>{fixture.awayTeam}</Text>
        </View>
      </View>

      {/* Venue */}
      {fixture.venue ? (
        <View style={pStyles.venueRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={pStyles.venueText} numberOfLines={1}>{fixture.venue}</Text>
        </View>
      ) : null}
    </View>
  );
}

const pStyles = StyleSheet.create({
  sectionLabel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  sectionLabelText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  // card matches MatchCard style
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stageText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flag: {
    width: scale(40),
    height: scale(28),
    borderRadius: 6,
    overflow: 'hidden',
  },
  teamName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  scoreBox: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  vs: {
    fontSize: Typography.lg,
    fontWeight: '900',
    color: Colors.textMuted,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  venueText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    flex: 1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

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
