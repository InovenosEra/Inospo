import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchLeaderboard, fetchGlobalLeague, fetchUserLeagues, createLeague, joinLeague } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, profile } = useAuth();
  const qc = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [leagueCode, setLeagueCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    refetchInterval: 60 * 1000,
  });

  const { data: globalLeague } = useQuery({
    queryKey: ['global-league'],
    queryFn: fetchGlobalLeague,
  });

  const { data: userLeagues = [] } = useQuery({
    queryKey: ['user-leagues', profile?.id],
    queryFn: () => fetchUserLeagues(profile!.id),
    enabled: !!profile?.id,
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinLeague(code, profile!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-leagues'] });
      setLeagueCode('');
      setShowLeagueModal(false);
      Alert.alert('Joined!', 'You have joined the league.');
    },
    onError: () => Alert.alert('Error', 'League not found. Check the invite code.'),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createLeague(name, profile!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-leagues'] });
      setNewLeagueName('');
      setShowLeagueModal(false);
      Alert.alert('Created!', 'Your private league is ready. Share the code with friends!');
    },
    onError: () => Alert.alert('Error', 'Could not create league. Try again.'),
  });

  // Filter leaderboard entries by active league (simplified — global for now)
  const displayedEntries = leaderboard;
  const currentUserRank = leaderboard.findIndex((e) => e.profile.id === profile?.id) + 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rankings</Text>
        {isAuthenticated ? (
          <TouchableOpacity style={styles.leagueBtn} onPress={() => setShowLeagueModal(true)}>
            <Ionicons name="people-outline" size={16} color={Colors.primary} />
            <Text style={styles.leagueBtnText}>Leagues</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowAuth(true)}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* League Selector */}
      {isAuthenticated && userLeagues.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueSelector}
        >
          <TouchableOpacity
            style={[styles.leagueChip, !activeLeagueId && styles.leagueChipActive]}
            onPress={() => setActiveLeagueId(null)}
          >
            <Text style={[styles.leagueChipText, !activeLeagueId && styles.leagueChipTextActive]}>
              🌍 Global
            </Text>
          </TouchableOpacity>
          {userLeagues.map((league) => (
            <TouchableOpacity
              key={league.id}
              style={[styles.leagueChip, activeLeagueId === league.id && styles.leagueChipActive]}
              onPress={() => setActiveLeagueId(league.id)}
            >
              <Text style={[styles.leagueChipText, activeLeagueId === league.id && styles.leagueChipTextActive]}>
                {league.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Your Rank Banner */}
      {isAuthenticated && currentUserRank > 0 && (
        <View style={styles.yourRankBanner}>
          <Text style={styles.yourRankText}>Your rank</Text>
          <Text style={styles.yourRankValue}>#{currentUserRank}</Text>
          <Text style={styles.yourRankPoints}>{profile?.total_points ?? 0} pts</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={displayedEntries}
        keyExtractor={(item) => item.profile.id}
        renderItem={({ item }) => (
          <LeaderboardRow
            entry={item}
            isCurrentUser={item.profile.id === profile?.id}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={42} color={Colors.primary} />
              <Text style={styles.emptyText}>No rankings yet</Text>
              <Text style={styles.emptySubtext}>
                The leaderboard fills in once predictions start scoring on June 11.
              </Text>

              {/* How points work */}
              <View style={styles.pointsCard}>
                <Text style={styles.pointsTitle}>How points work</Text>
                <View style={styles.pointsRow}>
                  <View style={[styles.pointsChip, { backgroundColor: Colors.primaryDim }]}>
                    <Text style={[styles.pointsChipText, { color: Colors.primary }]}>+5</Text>
                  </View>
                  <Text style={styles.pointsLabel}>Exact score</Text>
                </View>
                <View style={styles.pointsRow}>
                  <View style={[styles.pointsChip, { backgroundColor: Colors.accentDim }]}>
                    <Text style={[styles.pointsChipText, { color: Colors.accent }]}>+2</Text>
                  </View>
                  <Text style={styles.pointsLabel}>Right result (winner or draw)</Text>
                </View>
                <View style={styles.pointsRow}>
                  <View style={[styles.pointsChip, { backgroundColor: 'rgba(100,116,139,0.15)' }]}>
                    <Text style={[styles.pointsChipText, { color: Colors.textMuted }]}>+0</Text>
                  </View>
                  <Text style={styles.pointsLabel}>Wrong direction</Text>
                </View>
              </View>

              {/* Preview leaderboard */}
              <Text style={styles.previewLabel}>PREVIEW</Text>
              <View style={styles.previewWrap}>
                {[
                  { rank: 1, name: '@yourfriendscoring', pts: 187 },
                  { rank: 2, name: '@goalshark', pts: 164 },
                  { rank: 3, name: '@scoreking', pts: 152 },
                ].map((row) => (
                  <View key={row.rank} style={styles.previewRow}>
                    <Text style={[
                      styles.previewRank,
                      row.rank === 1 && { color: Colors.primary },
                    ]}>
                      {row.rank}
                    </Text>
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarInitial}>{row.name[1].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.previewName} numberOfLines={1}>{row.name}</Text>
                    <Text style={styles.previewPts}>{row.pts}<Text style={styles.previewPtsUnit}> pts</Text></Text>
                  </View>
                ))}
                <View pointerEvents="none" style={styles.previewDim} />
              </View>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Auth Modal */}
      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} />

      {/* League Modal */}
      <Modal
        visible={showLeagueModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLeagueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Private Leagues</Text>
              <TouchableOpacity onPress={() => setShowLeagueModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Join League */}
            <Text style={styles.sectionLabel}>Join a League</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter invite code"
                placeholderTextColor={Colors.textMuted}
                value={leagueCode}
                onChangeText={setLeagueCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.actionBtn, !leagueCode && styles.actionBtnDisabled]}
                onPress={() => joinMutation.mutate(leagueCode)}
                disabled={!leagueCode || joinMutation.isPending}
              >
                <Text style={styles.actionBtnText}>Join</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Create League */}
            <Text style={styles.sectionLabel}>Create a League</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="League name"
                placeholderTextColor={Colors.textMuted}
                value={newLeagueName}
                onChangeText={setNewLeagueName}
              />
              <TouchableOpacity
                style={[styles.actionBtn, !newLeagueName && styles.actionBtnDisabled]}
                onPress={() => createMutation.mutate(newLeagueName)}
                disabled={!newLeagueName || createMutation.isPending}
              >
                <Text style={styles.actionBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.primary },
  leagueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  leagueBtnText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '600' },
  signInLink: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '600' },
  leagueSelector: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  leagueChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  leagueChipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  leagueChipText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  leagueChipTextActive: { color: Colors.primary },
  yourRankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDim,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.md,
  },
  yourRankText: { color: Colors.textSecondary, fontSize: Typography.sm, flex: 1 },
  yourRankValue: { color: Colors.primary, fontSize: Typography.lg, fontWeight: '800' },
  yourRankPoints: { color: Colors.textSecondary, fontSize: Typography.sm },
  listContent: { paddingHorizontal: Spacing.lg },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },

  // Points explainer + preview rows
  pointsCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  pointsTitle: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pointsChip: {
    width: 40,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsChipText: {
    fontSize: Typography.sm,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  pointsLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },

  previewLabel: {
    width: '100%',
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: Spacing.lg,
    marginBottom: 4,
    paddingLeft: 4,
  },
  previewWrap: {
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  previewRank: {
    width: 24,
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarInitial: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  previewName: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  previewPts: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  previewPtsUnit: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  previewDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,17,36,0.45)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  inputRow: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: Typography.base,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: Typography.base },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
});
