import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchMatchById,
  fetchMatchFact,
  fetchQualificationFixtures,
  fetchH2H,
  fetchMatchStatistics,
  fetchMatchEvents,
  fetchMatchLineups,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PredictionModal } from '@/components/PredictionModal';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import type { Match } from '@/types';

// Flag map (API-Football team ID → flagcdn URL)
const TEAM_FLAGS: Record<number, string> = {
  767: 'https://flagcdn.com/w80/gb-wls.png', 1113: 'https://flagcdn.com/w80/ba.png',
  768: 'https://flagcdn.com/w80/it.png',     771:  'https://flagcdn.com/w80/gb-nir.png',
  24:  'https://flagcdn.com/w80/pl.png',     778:  'https://flagcdn.com/w80/al.png',
  772: 'https://flagcdn.com/w80/ua.png',     5:    'https://flagcdn.com/w80/se.png',
  773: 'https://flagcdn.com/w80/sk.png',     1111: 'https://flagcdn.com/w80/xk.png',
  777: 'https://flagcdn.com/w80/tr.png',     774:  'https://flagcdn.com/w80/ro.png',
  770: 'https://flagcdn.com/w80/cz.png',     776:  'https://flagcdn.com/w80/ie.png',
  21:  'https://flagcdn.com/w80/dk.png',     1105: 'https://flagcdn.com/w80/mk.png',
  5163:'https://flagcdn.com/w80/nc.png',     2385: 'https://flagcdn.com/w80/jm.png',
  1508:'https://flagcdn.com/w80/cd.png',     2381: 'https://flagcdn.com/w80/bo.png',
  8171:'https://flagcdn.com/w80/sr.png',     1567: 'https://flagcdn.com/w80/iq.png',
};

type TabKey = 'h2h' | 'stats' | 'lineups' | 'events';

export default function MatchDetailScreen() {
  const { id, playoff } = useLocalSearchParams<{ id: string; playoff?: string }>();
  const isPlayoff = playoff === 'true';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, profile } = useAuth();
  const [showPrediction, setShowPrediction] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('h2h');
  const [factKey, setFactKey] = useState(0);

  // ── Group stage match (Supabase DB) ──────────────────────────────────────
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => fetchMatchById(id),
    enabled: !isPlayoff,
  });

  // ── Playoff match (API-Football via cached fixtures query) ────────────────
  const { data: playoffFixtures = [], isLoading: fixturesLoading } = useQuery({
    queryKey: ['qualificationFixtures'],
    queryFn: fetchQualificationFixtures,
    staleTime: 5 * 60 * 1000,
    enabled: isPlayoff,
  });
  const playoffMatch = isPlayoff
    ? (playoffFixtures.find((f) => String(f.id) === String(id)) ?? null)
    : null;

  const isLoading = isPlayoff ? fixturesLoading : matchLoading;

  // ── Unified display values ────────────────────────────────────────────────
  const homeTeamName = isPlayoff ? (playoffMatch?.homeTeam ?? '') : (match?.home_team?.name ?? '');
  const awayTeamName = isPlayoff ? (playoffMatch?.awayTeam ?? '') : (match?.away_team?.name ?? '');
  const homeFlag = isPlayoff
    ? (TEAM_FLAGS[playoffMatch?.homeTeamId ?? 0] || playoffMatch?.homeLogo || '')
    : (match?.home_team?.flag_url ?? '');
  const awayFlag = isPlayoff
    ? (TEAM_FLAGS[playoffMatch?.awayTeamId ?? 0] || playoffMatch?.awayLogo || '')
    : (match?.away_team?.flag_url ?? '');
  const status = isPlayoff ? (playoffMatch?.status ?? 'scheduled') : (match?.status ?? 'scheduled');
  const isFinished = status === 'finished' || status === 'completed';
  const isLive = status === 'live';
  const isScheduled = status === 'scheduled';
  const dateStr = isPlayoff ? (playoffMatch?.date ?? '') : (match?.match_date ?? '');
  const venue = isPlayoff
    ? (playoffMatch?.venue ?? '')
    : (match?.stadium ? [match.stadium, match.city].filter(Boolean).join(', ') : '');
  const stage = isPlayoff ? (playoffMatch?.round ?? '') : (match?.stage ?? '');
  const scoreDisplay = isPlayoff
    ? (playoffMatch?.score ?? null)
    : (match?.home_score != null && match?.away_score != null
        ? `${match.home_score} – ${match.away_score}`
        : null);

  // ── AI Fact ───────────────────────────────────────────────────────────────
  const factEnabled = isPlayoff ? !!playoffMatch : !!match;
  const { data: fact, isFetching: factFetching } = useQuery({
    queryKey: ['match-fact', id, factKey],
    queryFn: () => {
      if (isPlayoff && playoffMatch) {
        return fetchMatchFact({
          home_team: { name: homeTeamName } as any,
          away_team: { name: awayTeamName } as any,
          stadium: venue,
          city: '',
          stage,
        } as Match);
      }
      return fetchMatchFact(match!);
    },
    enabled: factEnabled,
    staleTime: 10 * 60 * 1000,
  });

  // ── Determine fixtureId for stats/events/lineups (playoff only) ──────────
  const fixtureId = isPlayoff ? String(id) : null;

  // ── H2H ──────────────────────────────────────────────────────────────────
  const { data: h2hData, isLoading: h2hLoading } = useQuery({
    queryKey: ['h2h', homeTeamName, awayTeamName],
    queryFn: () => fetchH2H(homeTeamName, awayTeamName),
    enabled: activeTab === 'h2h' && !!homeTeamName && !!awayTeamName,
    staleTime: 30 * 60 * 1000,
  });

  // ── Statistics ────────────────────────────────────────────────────────────
  const { data: statsData = [], isLoading: statsLoading } = useQuery({
    queryKey: ['match-stats', fixtureId],
    queryFn: () => fetchMatchStatistics(fixtureId!),
    enabled: activeTab === 'stats' && !!fixtureId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Events ────────────────────────────────────────────────────────────────
  const { data: eventsData = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['match-events', fixtureId],
    queryFn: () => fetchMatchEvents(fixtureId!),
    enabled: activeTab === 'events' && !!fixtureId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Lineups ───────────────────────────────────────────────────────────────
  const { data: lineupsData = [], isLoading: lineupsLoading } = useQuery({
    queryKey: ['match-lineups', fixtureId],
    queryFn: () => fetchMatchLineups(fixtureId!),
    enabled: activeTab === 'lineups' && !!fixtureId,
    staleTime: 30 * 60 * 1000,
  });

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isLoading && ((isPlayoff && !playoffMatch) || (!isPlayoff && !match))) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Match not found</Text>
      </View>
    );
  }

  const displayDate = dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      }) + ' · ' + new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : '';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'h2h', label: 'H2H' },
    { key: 'stats', label: 'Stats' },
    { key: 'lineups', label: 'Lineups' },
    { key: 'events', label: 'Events' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Match Hero Card ── */}
        <View style={styles.heroCard}>
          {/* Stage chip + live/ft badge */}
          <View style={styles.heroTop}>
            {stage ? (
              <Text style={styles.heroStage}>{stage.toUpperCase()}</Text>
            ) : (
              <View />
            )}
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            {isFinished && <Text style={styles.ftBadge}>FT</Text>}
          </View>

          {/* Teams + Score */}
          <View style={styles.teamsRow}>
            <View style={styles.teamBlock}>
              <Image source={{ uri: homeFlag }} style={styles.flag} resizeMode="cover" />
              <Text style={styles.teamName}>{homeTeamName}</Text>
            </View>

            <View style={styles.scoreBlock}>
              {isFinished || isLive ? (
                <Text style={[styles.scoreText, isLive && styles.scoreLive]}>
                  {scoreDisplay ?? '? – ?'}
                </Text>
              ) : (
                <Text style={styles.vsText}>VS</Text>
              )}
            </View>

            <View style={styles.teamBlock}>
              <Image source={{ uri: awayFlag }} style={styles.flag} resizeMode="cover" />
              <Text style={styles.teamName}>{awayTeamName}</Text>
            </View>
          </View>

          {/* Date + Venue */}
          <View style={styles.metaSection}>
            {displayDate ? (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{displayDate}</Text>
              </View>
            ) : null}
            {venue ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{venue}</Text>
              </View>
            ) : null}
          </View>

          {/* Predict Button (group stage only) */}
          {isScheduled && !isPlayoff && isAuthenticated && (
            <TouchableOpacity
              style={styles.predictBtn}
              onPress={() => setShowPrediction(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.predictBtnText}>Make Prediction</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Did You Know? ── */}
        <View style={styles.factCard}>
          <View style={styles.factHeader}>
            <Text style={styles.factLabel}>💡 Did You Know?</Text>
            <TouchableOpacity
              onPress={() => setFactKey((k) => k + 1)}
              style={styles.refreshBtn}
              disabled={factFetching}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={factFetching ? Colors.textMuted : Colors.primary}
              />
            </TouchableOpacity>
          </View>
          {factFetching ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
          ) : fact ? (
            <Text style={styles.factText}>{fact}</Text>
          ) : (
            <Text style={styles.factPlaceholder}>Tap refresh to load a match insight...</Text>
          )}
        </View>

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab Content ── */}
        {activeTab === 'h2h' && (
          <H2HTab loading={h2hLoading} data={h2hData} homeTeam={homeTeamName} awayTeam={awayTeamName} />
        )}
        {activeTab === 'stats' && (
          <StatsTab
            loading={statsLoading}
            data={statsData}
            homeTeam={homeTeamName}
            awayTeam={awayTeamName}
            hasFixtureId={!!fixtureId}
            isScheduled={isScheduled}
          />
        )}
        {activeTab === 'lineups' && (
          <LineupsTab loading={lineupsLoading} data={lineupsData} hasFixtureId={!!fixtureId} />
        )}
        {activeTab === 'events' && (
          <EventsTab loading={eventsLoading} data={eventsData} hasFixtureId={!!fixtureId} isScheduled={isScheduled} />
        )}
      </ScrollView>

      {/* Prediction Modal (group stage only) */}
      {!isPlayoff && match && (
        <PredictionModal
          match={match}
          userId={profile?.id ?? ''}
          visible={showPrediction}
          onClose={() => setShowPrediction(false)}
        />
      )}
    </View>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

// Stats that are always shown (even if value is 0)
const STAT_LABELS: Record<string, string> = {
  'Ball Possession': 'Possession',
  'Total Shots': 'Shots',
  'Shots on Goal': 'On Target',
  'Shots off Goal': 'Off Target',
  'Blocked Shots': 'Blocked',
  'Corner Kicks': 'Corners',
  'Fouls': 'Fouls',
  'Yellow Cards': 'Yellow Cards',
  'Red Cards': 'Red Cards',
  'Offsides': 'Offsides',
  'Passes Accurate': 'Passes Accurate',
  'Pass Accuracy': 'Pass Accuracy',
  'Goalkeeper Saves': 'Saves',
};

const PRIORITY_STATS = [
  'Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks',
  'Fouls', 'Yellow Cards', 'Red Cards', 'Offsides', 'Goalkeeper Saves',
];

function StatBar({ label, homeVal, awayVal }: { label: string; homeVal: string; awayVal: string }) {
  const parse = (v: string) => {
    if (!v || v === 'null') return 0;
    return parseFloat(v.replace('%', '')) || 0;
  };
  const h = parse(homeVal);
  const a = parse(awayVal);
  const total = h + a;
  const homePct = total > 0 ? h / total : 0.5;

  return (
    <View style={statStyles.row}>
      <Text style={statStyles.valLeft}>{homeVal ?? '0'}</Text>
      <View style={statStyles.barWrap}>
        <Text style={statStyles.label}>{label}</Text>
        <View style={statStyles.bar}>
          <View style={[statStyles.barHome, { flex: homePct }]} />
          <View style={[statStyles.barAway, { flex: 1 - homePct }]} />
        </View>
      </View>
      <Text style={statStyles.valRight}>{awayVal ?? '0'}</Text>
    </View>
  );
}

function StatsTab({ loading, data, homeTeam, awayTeam, hasFixtureId, isScheduled }: {
  loading: boolean;
  data: any[];
  homeTeam: string;
  awayTeam: string;
  hasFixtureId: boolean;
  isScheduled: boolean;
}) {
  if (!hasFixtureId) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="stats-chart-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>No Statistics</Text>
        <Text style={styles.comingSoonSub}>Stats are available for qualifying playoff matches only.</Text>
      </View>
    );
  }
  if (isScheduled) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="stats-chart-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>Match Not Started</Text>
        <Text style={styles.comingSoonSub}>Statistics will appear once the match kicks off.</Text>
      </View>
    );
  }
  if (loading) {
    return <View style={styles.h2hLoading}><ActivityIndicator size="small" color={Colors.primary} /></View>;
  }
  if (!data.length) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="stats-chart-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>No Statistics Available</Text>
      </View>
    );
  }

  // data[0] = home team, data[1] = away team
  const homeStats: Record<string, string> = {};
  const awayStats: Record<string, string> = {};
  (data[0]?.statistics || []).forEach((s: any) => { homeStats[s.type] = String(s.value ?? 0); });
  (data[1]?.statistics || []).forEach((s: any) => { awayStats[s.type] = String(s.value ?? 0); });

  return (
    <View style={statStyles.container}>
      {/* Team headers */}
      <View style={statStyles.header}>
        <Text style={statStyles.teamLeft} numberOfLines={1}>{homeTeam}</Text>
        <View style={statStyles.headerSpacer} />
        <Text style={statStyles.teamRight} numberOfLines={1}>{awayTeam}</Text>
      </View>
      {PRIORITY_STATS.map((key) => {
        const label = STAT_LABELS[key] ?? key;
        const h = homeStats[key] ?? '0';
        const a = awayStats[key] ?? '0';
        if (h === '0' && a === '0' && (key === 'Yellow Cards' || key === 'Red Cards')) return null;
        return <StatBar key={key} label={label} homeVal={h} awayVal={a} />;
      })}
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: { gap: 2, marginBottom: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  teamLeft: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '700',
    textAlign: 'left',
  },
  headerSpacer: { width: scale(100) },
  teamRight: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  valLeft: {
    width: scale(36),
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  valRight: {
    width: scale(36),
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '700',
    textAlign: 'left',
  },
  barWrap: { flex: 1, alignItems: 'center', gap: 3 },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  barHome: { backgroundColor: Colors.primary, minWidth: 3 },
  barAway: { backgroundColor: Colors.borderLight, minWidth: 3 },
});

// ── Lineups Tab ───────────────────────────────────────────────────────────────

function LineupsTab({ loading, data, hasFixtureId }: {
  loading: boolean;
  data: any[];
  hasFixtureId: boolean;
}) {
  if (!hasFixtureId) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>No Lineups</Text>
        <Text style={styles.comingSoonSub}>Lineups are available for qualifying playoff matches only.</Text>
      </View>
    );
  }
  if (loading) {
    return <View style={styles.h2hLoading}><ActivityIndicator size="small" color={Colors.primary} /></View>;
  }
  if (!data.length) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>Lineups Not Available</Text>
        <Text style={styles.comingSoonSub}>Lineups will appear once confirmed before kick-off.</Text>
      </View>
    );
  }

  return (
    <View style={lineupStyles.container}>
      {data.map((team: any) => (
        <View key={team.team?.id} style={lineupStyles.teamSection}>
          <View style={lineupStyles.teamHeader}>
            <Image source={{ uri: team.team?.logo }} style={lineupStyles.teamLogo} />
            <Text style={lineupStyles.teamName}>{team.team?.name}</Text>
            <Text style={lineupStyles.formation}>{team.formation}</Text>
          </View>
          <Text style={lineupStyles.sectionLabel}>STARTING XI</Text>
          {(team.startXI || []).map((p: any, i: number) => (
            <View key={p.player?.id ?? i} style={lineupStyles.playerRow}>
              <Text style={lineupStyles.playerNum}>{p.player?.number}</Text>
              <Text style={lineupStyles.playerName}>{p.player?.name}</Text>
              <Text style={lineupStyles.playerPos}>{p.player?.pos}</Text>
            </View>
          ))}
          {team.substitutes?.length > 0 && (
            <>
              <Text style={[lineupStyles.sectionLabel, { marginTop: Spacing.md }]}>SUBSTITUTES</Text>
              {(team.substitutes || []).map((p: any, i: number) => (
                <View key={p.player?.id ?? i} style={[lineupStyles.playerRow, lineupStyles.subRow]}>
                  <Text style={[lineupStyles.playerNum, lineupStyles.subNum]}>{p.player?.number}</Text>
                  <Text style={[lineupStyles.playerName, lineupStyles.subName]}>{p.player?.name}</Text>
                  <Text style={lineupStyles.playerPos}>{p.player?.pos}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const lineupStyles = StyleSheet.create({
  container: { gap: Spacing.md },
  teamSection: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  teamLogo: { width: scale(24), height: scale(24), borderRadius: 4 },
  teamName: { flex: 1, color: Colors.text, fontSize: Typography.base, fontWeight: '700' },
  formation: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  subRow: { opacity: 0.7 },
  playerNum: {
    width: scale(24),
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '800',
    textAlign: 'center',
  },
  subNum: { color: Colors.textMuted },
  playerName: { flex: 1, color: Colors.text, fontSize: Typography.sm, fontWeight: '600' },
  subName: { color: Colors.textSecondary },
  playerPos: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
    width: scale(28),
    textAlign: 'right',
  },
});

// ── Events Tab ────────────────────────────────────────────────────────────────

const EVENT_ICON: Record<string, { name: any; color: string }> = {
  'Goal': { name: 'football-outline', color: Colors.accent },
  'Card': { name: 'card-outline', color: Colors.draw },
  'subst': { name: 'swap-horizontal-outline', color: Colors.textSecondary },
  'Var': { name: 'eye-outline', color: Colors.primary },
};

function EventsTab({ loading, data, hasFixtureId, isScheduled }: {
  loading: boolean;
  data: any[];
  hasFixtureId: boolean;
  isScheduled: boolean;
}) {
  if (!hasFixtureId) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="list-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>No Events</Text>
        <Text style={styles.comingSoonSub}>Events are available for qualifying playoff matches only.</Text>
      </View>
    );
  }
  if (isScheduled) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="list-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>Match Not Started</Text>
        <Text style={styles.comingSoonSub}>Events will appear once the match kicks off.</Text>
      </View>
    );
  }
  if (loading) {
    return <View style={styles.h2hLoading}><ActivityIndicator size="small" color={Colors.primary} /></View>;
  }
  if (!data.length) {
    return (
      <View style={styles.comingSoon}>
        <Ionicons name="list-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.comingSoonText}>No Events Available</Text>
      </View>
    );
  }

  return (
    <View style={eventStyles.container}>
      {data.map((ev: any, i: number) => {
        const type = ev.type as string;
        const detail = ev.detail as string;
        const iconInfo = EVENT_ICON[type] ?? EVENT_ICON['Var'];
        const isYellow = type === 'Card' && detail?.toLowerCase().includes('yellow');
        const isRed = type === 'Card' && (detail?.toLowerCase().includes('red') || detail?.toLowerCase().includes('second yellow'));
        const cardColor = isRed ? Colors.live : isYellow ? Colors.draw : iconInfo.color;
        const iconName = type === 'Card'
          ? (isRed ? 'close-circle-outline' : 'square-outline')
          : iconInfo.name;

        return (
          <View key={i} style={eventStyles.row}>
            <Text style={eventStyles.minute}>{ev.time?.elapsed ?? '?'}'</Text>
            <View style={eventStyles.iconWrap}>
              <Ionicons name={iconName} size={18} color={cardColor} />
            </View>
            <View style={eventStyles.info}>
              <Text style={eventStyles.player} numberOfLines={1}>
                {ev.player?.name ?? ''}
                {ev.assist?.name ? <Text style={eventStyles.assist}>{` (${ev.assist.name})`}</Text> : null}
              </Text>
              <Text style={eventStyles.detail} numberOfLines={1}>{ev.team?.name ?? ''} · {detail ?? type}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const eventStyles = StyleSheet.create({
  container: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: 4,
  },
  minute: {
    width: scale(32),
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '800',
    textAlign: 'right',
  },
  iconWrap: { width: scale(24), alignItems: 'center' },
  info: { flex: 1 },
  player: { color: Colors.text, fontSize: Typography.sm, fontWeight: '600' },
  assist: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '400' },
  detail: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
});

// ── H2H Tab ───────────────────────────────────────────────────────────────────

function H2HTab({
  loading,
  data,
  homeTeam,
  awayTeam,
}: {
  loading: boolean;
  data: any;
  homeTeam: string;
  awayTeam: string;
}) {
  if (loading) {
    return (
      <View style={styles.h2hLoading}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  const meetings: any[] = data?.response || [];

  if (!meetings.length) {
    return (
      <View style={styles.h2hEmpty}>
        <Ionicons name="trophy-outline" size={52} color={Colors.textMuted} />
        <Text style={styles.h2hEmptyTitle}>No Previous Meetings</Text>
        <Text style={styles.h2hEmptySubtitle}>
          {homeTeam} and {awayTeam} have not faced each other at the World Cup
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.h2hList}>
      <Text style={styles.h2hSummary}>{meetings.length} previous meeting{meetings.length !== 1 ? 's' : ''}</Text>
      {meetings.slice(0, 10).map((m: any) => {
        const mDate = new Date(m.fixture?.date || '');
        const dateLabel = mDate.toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
        const home = m.teams?.home?.name ?? '';
        const away = m.teams?.away?.name ?? '';
        const hGoals = m.goals?.home ?? '–';
        const aGoals = m.goals?.away ?? '–';
        const homeWon = m.teams?.home?.winner === true;
        const awayWon = m.teams?.away?.winner === true;
        const competition = m.league?.name ?? '';

        return (
          <View key={m.fixture?.id} style={styles.h2hRow}>
            <View style={styles.h2hRowTop}>
              <Text style={styles.h2hDate}>{dateLabel}</Text>
              {competition ? <Text style={styles.h2hComp}>{competition}</Text> : null}
            </View>
            <View style={styles.h2hMatchRow}>
              <Text
                style={[styles.h2hTeamLeft, homeWon && styles.h2hWinner]}
                numberOfLines={1}
              >
                {home}
              </Text>
              <View style={styles.h2hScoreBox}>
                <Text style={styles.h2hScore}>{hGoals} – {aGoals}</Text>
              </View>
              <Text
                style={[styles.h2hTeamRight, awayWon && styles.h2hWinner]}
                numberOfLines={1}
              >
                {away}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  errorText: { color: Colors.textMuted, fontSize: Typography.base, marginTop: Spacing.md },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backText: { color: Colors.text, fontSize: Typography.base, marginLeft: 4 },

  scroll: { paddingHorizontal: Spacing.lg },

  // Hero card
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroStage: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.liveDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.live },
  liveText: { color: Colors.live, fontSize: Typography.xs, fontWeight: '800' },
  ftBadge: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flag: {
    width: scale(72),
    height: scale(52),
    borderRadius: 10,
    overflow: 'hidden',
  },
  teamName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  scoreBlock: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: Typography.xxl,
    fontWeight: '900',
    color: Colors.text,
  },
  scoreLive: { color: Colors.live },
  vsText: {
    fontSize: Typography.xl,
    fontWeight: '900',
    color: Colors.textMuted,
  },

  metaSection: { gap: Spacing.xs },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    flex: 1,
  },

  predictBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    ...Shadows.gold,
  },
  predictBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '700',
  },

  // Fact card
  factCard: {
    backgroundColor: Colors.cardElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  factHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  factLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  refreshBtn: { padding: 4 },
  factText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  factPlaceholder: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontStyle: 'italic',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md - 2,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: Colors.textInverse,
  },

  // Coming soon (Stats / Lineups / Events)
  comingSoon: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  comingSoonText: {
    color: Colors.textMuted,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  comingSoonSub: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: 'center',
    maxWidth: 240,
  },

  // H2H
  h2hLoading: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  h2hEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  h2hEmptyTitle: {
    color: Colors.text,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  h2hEmptySubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  h2hList: { gap: Spacing.sm },
  h2hSummary: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  h2hRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  h2hRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  h2hDate: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  h2hComp: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontStyle: 'italic',
  },
  h2hMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  h2hTeamLeft: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'left',
  },
  h2hTeamRight: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  h2hWinner: {
    color: Colors.text,
    fontWeight: '800',
  },
  h2hScoreBox: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  h2hScore: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: '900',
  },
});
