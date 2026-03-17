import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchTeamById, fetchMatches } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchTeamById(id),
  });

  const { data: allMatches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
  });

  const teamMatches = allMatches.filter(
    (m) => m.home_team_id === id || m.away_team_id === id
  );

  if (isLoading || !team) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: team.flag_url }}
            style={styles.flag}
            resizeMode="contain"
          />
          <Text style={styles.teamName}>{team.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{team.code}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Group {team.group_name}</Text>
            </View>
          </View>
        </View>

        {/* Matches */}
        <Text style={styles.sectionTitle}>Matches</Text>
        {teamMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
        {teamMatches.length === 0 && (
          <Text style={styles.emptyText}>No matches scheduled yet</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backText: { color: Colors.text, fontSize: Typography.base, marginLeft: 4 },
  scroll: { paddingHorizontal: Spacing.lg },
  hero: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  flag: { width: 100, height: 70, borderRadius: Radius.sm },
  teamName: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  metaRow: { flexDirection: 'row', gap: Spacing.sm },
  badge: {
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  badgeText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '700' },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyText: { color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
});
