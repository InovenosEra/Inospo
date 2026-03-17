import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserPredictions } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { PredictionCard } from '@/components/PredictionCard';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
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

  const totalPoints = predictions.reduce((sum, p) => sum + p.points_earned, 0);
  const correct = predictions.filter((p) => p.points_earned > 0).length;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎯 My Picks</Text>
        </View>
        <View style={styles.unauthContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.unauthTitle}>Sign in to make predictions</Text>
          <Text style={styles.unauthSubtitle}>
            Predict match scores, earn points, and compete on the leaderboard
          </Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => setShowAuth(true)}>
            <Text style={styles.signInBtnText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        </View>
        <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 My Picks</Text>
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
  unauthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  unauthTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  unauthSubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  signInBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: Typography.base,
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
