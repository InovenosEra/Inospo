import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertPrediction } from '@/lib/api';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { Match } from '@/types';

interface Props {
  match: Match;
  userId: string;
  visible: boolean;
  onClose: () => void;
}

export function PredictionModal({ match, userId, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  const mutation = useMutation({
    mutationFn: () => upsertPrediction(userId, match.id, homeScore, awayScore),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prediction', userId, match.id] });
      qc.invalidateQueries({ queryKey: ['predictions', userId] });
      onClose();
    },
    onError: () => Alert.alert('Error', 'Could not save prediction. Try again.'),
  });

  function adjust(team: 'home' | 'away', delta: number) {
    if (team === 'home') setHomeScore((v) => Math.max(0, v + delta));
    else setAwayScore((v) => Math.max(0, v + delta));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Predict Score</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Teams */}
          <View style={styles.teamsRow}>
            {/* Home */}
            <View style={styles.teamCol}>
              <Image source={{ uri: match.home_team?.flag_url ?? undefined }} style={styles.flag} resizeMode="contain" />
              <Text style={styles.teamName} numberOfLines={2}>{match.home_team?.name}</Text>
            </View>

            {/* Score Picker */}
            <View style={styles.scorePicker}>
              <View style={styles.scoreCol}>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust('home', 1)}>
                  <Ionicons name="chevron-up" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.scoreNum}>{homeScore}</Text>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust('home', -1)}>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.dash}>–</Text>

              <View style={styles.scoreCol}>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust('away', 1)}>
                  <Ionicons name="chevron-up" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.scoreNum}>{awayScore}</Text>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust('away', -1)}>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Away */}
            <View style={styles.teamCol}>
              <Image source={{ uri: match.away_team?.flag_url ?? undefined }} style={styles.flag} resizeMode="contain" />
              <Text style={styles.teamName} numberOfLines={2}>{match.away_team?.name}</Text>
            </View>
          </View>

          {/* Points Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🏆 Exact score = <Text style={styles.infoHighlight}>5 pts</Text>
              {'  '}·{'  '}
              Correct result = <Text style={styles.infoHighlight}>2 pts</Text>
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
            activeOpacity={0.8}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>Save Prediction</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.text },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flag: { width: 56, height: 40, borderRadius: 4 },
  teamName: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  scorePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreCol: { alignItems: 'center', gap: Spacing.xs },
  adjBtn: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreNum: {
    fontSize: Typography.xxl,
    fontWeight: '900',
    color: Colors.primary,
    minWidth: 36,
    textAlign: 'center',
  },
  dash: {
    fontSize: Typography.xl,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  infoText: { color: Colors.textSecondary, fontSize: Typography.sm },
  infoHighlight: { color: Colors.primary, fontWeight: '700' },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: Typography.base },
});
