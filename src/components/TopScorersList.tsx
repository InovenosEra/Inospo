import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { scale } from '@/utils/responsive';
import type { TopScorer } from '@/types';

interface Props {
  scorers: TopScorer[];
  assists: TopScorer[];
  apiConnected: boolean;
}

// ── Mock data (shown before tournament starts) ────────────────────────────────

const MOCK_SCORERS: TopScorer[] = [
  { player_id: 1, player_name: 'Kylian Mbappé',    team_name: 'France',    team_code: 'FRA', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/31/85095807.png' },
  { player_id: 2, player_name: 'Erling Haaland',   team_name: 'Norway',    team_code: 'NOR', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/3/1719299.png' },
  { player_id: 3, player_name: 'Lionel Messi',     team_name: 'Argentina', team_code: 'ARG', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/14/50000782.png' },
  { player_id: 4, player_name: 'Harry Kane',       team_name: 'England',   team_code: 'ENG', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/18/986.png' },
  { player_id: 5, player_name: 'Vinícius Jr.',     team_name: 'Brazil',    team_code: 'BRA', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/10/37036938.png' },
];

const MOCK_XG: TopScorer[] = [
  { player_id: 6,  player_name: 'Erling Haaland',   team_name: 'Norway',    team_code: 'NOR', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/3/1719299.png' },
  { player_id: 7,  player_name: 'Kylian Mbappé',    team_name: 'France',    team_code: 'FRA', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/31/85095807.png' },
  { player_id: 8,  player_name: 'Harry Kane',       team_name: 'England',   team_code: 'ENG', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/18/986.png' },
  { player_id: 9,  player_name: 'Lautaro Martínez', team_name: 'Argentina', team_code: 'ARG', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/9/37058825.png' },
  { player_id: 10, player_name: 'Vinícius Jr.',     team_name: 'Brazil',    team_code: 'BRA', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/10/37036938.png' },
];

const MOCK_ASSISTS: TopScorer[] = [
  { player_id: 11, player_name: 'Kevin De Bruyne', team_name: 'Belgium',   team_code: 'BEL', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/6/3430.png' },
  { player_id: 12, player_name: 'Lionel Messi',    team_name: 'Argentina', team_code: 'ARG', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/14/50000782.png' },
  { player_id: 13, player_name: 'Bruno Fernandes', team_name: 'Portugal',  team_code: 'POR', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/9/37028361.png' },
  { player_id: 14, player_name: 'Florian Wirtz',   team_name: 'Germany',   team_code: 'GER', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/25/37061401.png' },
  { player_id: 15, player_name: 'Bukayo Saka',     team_name: 'England',   team_code: 'ENG', goals: 0, assists: 0, image_path: 'https://cdn.sportmonks.com/images/soccer/players/6/37055750.png' },
];

const FLAG: Record<string, string> = {
  FRA: 'https://flagcdn.com/w40/fr.png',
  NOR: 'https://flagcdn.com/w40/no.png',
  ARG: 'https://flagcdn.com/w40/ar.png',
  ENG: 'https://flagcdn.com/w40/gb-eng.png',
  BRA: 'https://flagcdn.com/w40/br.png',
  BEL: 'https://flagcdn.com/w40/be.png',
  POR: 'https://flagcdn.com/w40/pt.png',
  GER: 'https://flagcdn.com/w40/de.png',
};

// ── Main component ────────────────────────────────────────────────────────────

export function TopScorersList({ scorers, assists, apiConnected }: Props) {
  const [selected, setSelected] = useState<TopScorer | null>(null);

  const displayScorers = scorers.length > 0 ? scorers.slice(0, 5) : MOCK_SCORERS;
  const displayAssists = assists.length > 0 ? assists.slice(0, 5) : MOCK_ASSISTS;

  return (
    <>
      <View style={styles.container}>

        {/* Personal Statistics header */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Statistics</Text>
          </View>
          {!apiConnected && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>Stats will update when tournament begins</Text>
            </View>
          )}
        </View>

        {/* Top Scorers */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚽</Text>
            <Text style={styles.sectionTitle}>Top Scorers</Text>
          </View>
          {displayScorers.map((p, idx) => (
            <PlayerRow
              key={p.player_id}
              rank={idx + 1}
              player={p}
              value={p.goals}
              label="goals"
              isLast={idx === displayScorers.length - 1}
              onPress={() => setSelected(p)}
            />
          ))}
        </View>

        {/* Expected Goals (xG) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>Expected Goals (xG)</Text>
          </View>
          {MOCK_XG.map((p, idx) => (
            <PlayerRow
              key={p.player_id}
              rank={idx + 1}
              player={p}
              value={p.goals}
              label="xG"
              decimals
              isLast={idx === MOCK_XG.length - 1}
              onPress={() => setSelected(p)}
            />
          ))}
        </View>

        {/* Top Assists */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={styles.sectionTitle}>Top Assists</Text>
          </View>
          {displayAssists.map((p, idx) => (
            <PlayerRow
              key={p.player_id}
              rank={idx + 1}
              player={p}
              value={p.assists}
              label="assists"
              isLast={idx === displayAssists.length - 1}
              onPress={() => setSelected(p)}
            />
          ))}
        </View>

      </View>

      {/* Player detail modal */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSelected(null)}
        >
          {selected && (
            <View style={styles.modalCard}>
              <View style={styles.modalTop}>
                <Image
                  source={{ uri: selected.image_path || FLAG[selected.team_code] || '' }}
                  style={styles.modalAvatar}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalName}>{selected.player_name}</Text>
                  <Text style={styles.modalTeam}>{selected.team_name}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>{selected.goals}</Text>
                  <Text style={styles.modalStatLabel}>Goals</Text>
                </View>
                <View style={styles.modalDivider} />
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>{selected.assists}</Text>
                  <Text style={styles.modalStatLabel}>Assists</Text>
                </View>
              </View>
              <Text style={styles.modalNote}>
                Stats will update once the tournament begins
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRow({
  rank, player, value, label, decimals = false, isLast, onPress,
}: {
  rank: number;
  player: TopScorer;
  value: number;
  label: string;
  decimals?: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const rankColor =
    rank === 1 ? Colors.primary :
    rank === 2 ? '#9CA3AF' :
    rank === 3 ? '#B45309' :
    Colors.textMuted;

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.rank, { color: rankColor }]}>{rank}</Text>

      <View style={styles.avatar}>
        <Image
          source={{ uri: player.image_path || FLAG[player.team_code] || '' }}
          style={styles.avatarImg}
          resizeMode="cover"
        />
      </View>

      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>{player.player_name}</Text>
        <Text style={styles.teamName}>{player.team_name}</Text>
      </View>

      <View style={styles.stat}>
        <Text style={styles.statValue}>
          {decimals ? value.toFixed(1) : value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.md },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.cardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  offlineBanner: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  offlineText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionIcon: { fontSize: 13 },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.xs,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  rank: {
    width: scale(18),
    fontSize: Typography.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  avatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: Colors.cardElevated,
  },
  avatarImg: { width: '100%', height: '100%' },

  playerInfo: { flex: 1, minWidth: 0 },
  playerName: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  teamName: { color: Colors.textMuted, fontSize: 10 },

  stat: { alignItems: 'flex-end' },
  statValue: {
    color: Colors.primary,
    fontSize: Typography.lg,
    fontWeight: '800',
    lineHeight: Typography.lg * 1.1,
  },
  statLabel: { color: Colors.textMuted, fontSize: 10 },

  chevron: { color: Colors.textMuted, fontSize: 20 },

  // ── Modal ──────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.cardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalAvatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: Colors.surface,
  },
  modalName: { color: Colors.text, fontSize: Typography.base, fontWeight: '800' },
  modalTeam: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: 2 },
  modalClose: { color: Colors.textMuted, fontSize: 18, padding: 4 },
  modalStats: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  modalStat: { flex: 1, alignItems: 'center' },
  modalStatValue: {
    color: Colors.primary,
    fontSize: Typography.xxl,
    fontWeight: '800',
  },
  modalStatLabel: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: 4 },
  modalDivider: { width: 1, backgroundColor: Colors.border },
  modalNote: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
});
