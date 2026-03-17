import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { NewsArticle } from '@/types';

interface Props {
  article: NewsArticle;
  onPress: () => void;
}

export function NewsCard({ article, onPress }: Props) {
  const timeAgo = formatTimeAgo(article.published_at);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {article.image_url && (
        <Image
          source={{ uri: article.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.source}>{article.source}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.summary} numberOfLines={3}>{article.summary}</Text>
        <View style={styles.footer}>
          <Text style={styles.readMore}>Read more</Text>
          <Ionicons name="open-outline" size={14} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: { padding: Spacing.lg },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  source: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: { color: Colors.textMuted, fontSize: Typography.xs },
  title: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  summary: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readMore: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '600' },
});
