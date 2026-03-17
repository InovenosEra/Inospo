import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchNews, fetchTeams } from '@/lib/api';
import { NewsCard } from '@/components/NewsCard';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const { data: articles = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['news', selectedTeam],
    queryFn: () => fetchNews(selectedTeam ?? undefined),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = articles.filter((a) =>
    search.length === 0 ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search news..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Team Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.teamFilters}
      >
        <TouchableOpacity
          style={[styles.teamChip, !selectedTeam && styles.teamChipActive]}
          onPress={() => setSelectedTeam(null)}
        >
          <Text style={[styles.teamChipText, !selectedTeam && styles.teamChipTextActive]}>All Teams</Text>
        </TouchableOpacity>
        {teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={[styles.teamChip, selectedTeam === team.code && styles.teamChipActive]}
            onPress={() => setSelectedTeam(selectedTeam === team.code ? null : team.code)}
          >
            <Text style={[styles.teamChipText, selectedTeam === team.code && styles.teamChipTextActive]}>
              {team.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Articles */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard article={item} onPress={() => item.url && Linking.openURL(item.url)} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading news...' : 'No articles found'}
            </Text>
          </View>
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
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.base,
    paddingVertical: Spacing.md,
  },
  teamFilters: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  teamChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  teamChipActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  teamChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  teamChipTextActive: { color: Colors.primary },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
  },
});
