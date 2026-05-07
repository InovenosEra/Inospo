import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserPredictions } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { PredictionCard } from '@/components/PredictionCard';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import { useState } from 'react';

export default function PicksScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, profile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictions', profile?.id],
    queryFn: () => fetchUserPredictions(profile!.id),
    enabled: !!profile?.id,
  });

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned ?? 0), 0);
  const correct = predictions.filter((p) => (p.points_earned ?? 0) > 0).length;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Picks</Text>
        </View>
        <ScrollView
          contentContainerStyle={[styles.unauthScroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.unauthTitle}>Sign in to make predictions</Text>
          <Text style={styles.unauthSubtitle}>
            Predict match scores, earn points, and compete on the leaderboard
          </Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => setShowAuth(true)}>
            <Text style={styles.signInBtnText}>Sign In / Create Account</Text>
          </TouchableOpacity>

          {/* How points work */}
          <View style={styles.pointsCard}>
            <Text style={styles.pointsTitle}>How points work</Text>
            <View style={styles.pointsRow}>
              <View style={[styles.pointsChip, { backgroundColor: Colors.primaryDim }]}>
                <Text style={[styles.pointsChipText, { color: Colors.primary }]}>+5</Text>
              </View>
              <Text style={styles.pointsLabel}>Exact score (e.g. you predict 2-1, it ends 2-1)</Text>
            </View>
            <View style={styles.pointsRow}>
              <View style={[styles.pointsChip, { backgroundColor: Colors.accentDim }]}>
                <Text style={[styles.pointsChipText, { color: Colors.accent }]}>+2</Text>
              </View>
              <Text style={styles.pointsLabel}>Right result (correct winner or draw)</Text>
            </View>
            <View style={styles.pointsRow}>
              <View style={[styles.pointsChip, { backgroundColor: 'rgba(100,116,139,0.15)' }]}>
                <Text style={[styles.pointsChipText, { color: Colors.textMuted }]}>+0</Text>
              </View>
              <Text style={styles.pointsLabel}>Wrong direction</Text>
            </View>
          </View>

          {/* Preview: what predictions look like */}
          <Text style={styles.previewLabel}>PREVIEW</Text>
          <View style={styles.previewWrap}>
            <View style={styles.previewCard}>
              <View style={styles.previewTopRow}>
                <Text style={styles.previewStage}>GROUP A · 11 JUN</Text>
                <View style={styles.previewPointsBadge}>
                  <Text style={styles.previewPointsText}>+5 PTS</Text>
                </View>
              </View>
              <View style={styles.previewTeamsRow}>
                <View style={styles.previewTeamSide}>
                  <Image
                    source={{ uri: 'https://flagcdn.com/w80/mx.png' }}
                    style={styles.previewFlag}
                    resizeMode="cover"
                  />
                  <Text style={styles.previewTeamName}>Mexico</Text>
                </View>
                <View style={styles.previewScoreBox}>
                  <Text style={styles.previewYourPick}>YOUR PICK</Text>
                  <Text style={styles.previewScore}>2  –  1</Text>
                  <Text style={styles.previewActual}>Final: 2-1</Text>
                </View>
                <View style={styles.previewTeamSide}>
                  <Image
                    source={{ uri: 'https://flagcdn.com/w80/za.png' }}
                    style={styles.previewFlag}
                    resizeMode="cover"
                  />
                  <Text style={styles.previewTeamName}>S. Africa</Text>
                </View>
              </View>
            </View>
            {/* Soft dim overlay to signal "preview" */}
            <View pointerEvents="none" style={styles.previewDim} />
          </View>
        </ScrollView>
        <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Picks</Text>
        {profile && (
          <Text style={styles.headerUsername}>@{profile.username}</Text>
        )}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{predictions.length}</Text>
          <Text style={styles.statLabel}>Predictions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{correct}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
      </View>

      {/* Predictions List */}
      <FlatList
        data={predictions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PredictionCard prediction={item} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No predictions yet</Text>
              <Text style={styles.emptySubtext}>Go to Matches to make your first pick!</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerUsername: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  unauthScroll: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  unauthTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  unauthSubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  signInBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: Typography.base,
  },

  // How points work card
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
    width: scale(40),
    height: scale(28),
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
    lineHeight: 18,
  },

  // Preview prediction card
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
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewStage: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewPointsBadge: {
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  previewPointsText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTeamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  previewFlag: {
    width: scale(34),
    height: scale(24),
    borderRadius: 4,
  },
  previewTeamName: {
    color: Colors.text,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  previewScoreBox: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  previewYourPick: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  previewScore: {
    color: Colors.primary,
    fontSize: Typography.xl,
    fontWeight: '900',
    letterSpacing: 1,
  },
  previewActual: {
    color: Colors.accent,
    fontSize: Typography.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  previewDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,17,36,0.45)',
    borderRadius: Radius.lg,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
});
