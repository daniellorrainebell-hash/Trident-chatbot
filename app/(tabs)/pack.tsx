import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, EmptyState, ListRow, Pill, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import {
  seedPack, seedPackMembers, seedPackStats, seedLeaderboard, seedYardPosts, SEED_TODAY,
} from '@/data/seed';
import { backend } from '@/services/backend/localBackend';
import { useUserStore } from '@/store/userStore';
import { formatVolume, formatPercent, formatRank, formatRelative } from '@/utils/format';
import type { LeaderboardCategory, LeaderboardScope } from '@/types';

const SCOPES: Array<{ id: LeaderboardScope; label: string }> = [
  { id: 'pack', label: 'Pack' },
  { id: 'gym', label: 'Gym' },
  { id: 'town', label: 'Town' },
  { id: 'uk', label: 'UK' },
  { id: 'global', label: 'Global' },
];

/**
 * Categories are always explicit (spec §20): a runner and a powerlifter are not
 * ranked against each other, so the board never mixes incompatible metrics into
 * one "overall" list.
 */
const CATEGORIES: Array<{ id: LeaderboardCategory; label: string }> = [
  { id: 'rabid_score', label: 'Rabid Score' },
  { id: 'workouts', label: 'Sessions' },
  { id: 'volume', label: 'Volume' },
  { id: 'streak', label: 'Streaks' },
  { id: 'distance', label: 'Distance' },
];

export default function PackScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('pack');
  const [category, setCategory] = useState<LeaderboardCategory>('rabid_score');

  const now = new Date(`${SEED_TODAY}T20:00:00Z`);
  const yourPosition = seedLeaderboard.find((e) => e.isCurrentUser);
  const userId = useUserStore((s) => s.profile?.id);

  const confirmLeave = () => {
    Alert.alert(
      `Leave ${seedPack.name}?`,
      'Your training history stays yours. You will drop off this Pack\'s leaderboard and lose access to its activity.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave Pack',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            await backend.leavePack(seedPack.id, userId);
            router.replace('/kennel');
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">The Pack</Text>
        <Text variant="bodySmall" tone="tertiary">
          {seedPack.name} · {seedPack.location}
        </Text>
      </View>

      <Card>
        <Text variant="h3">{seedPack.name}</Text>
        <Text variant="bodySmall" tone="tertiary" style={styles.description}>
          {seedPack.description}
        </Text>

        <View style={styles.statRow}>
          <StatBlock label="Members" value={String(seedPack.memberCount)} size="medium" />
          <StatBlock
            label="Sessions"
            value={String(seedPackStats.workoutsThisWeek)}
            detail="This week"
            size="medium"
          />
          <StatBlock
            label="Attendance"
            value={formatPercent(seedPackStats.attendance)}
            detail="This week"
            size="medium"
          />
        </View>

        <View style={[styles.statRow, styles.secondRow]}>
          <StatBlock
            label="Combined volume"
            value={formatVolume(seedPackStats.combinedVolumeKg).split(' ')[0] ?? '0'}
            unit="kg"
            size="medium"
          />
          <StatBlock
            label="Active streaks"
            value={String(seedPackStats.activeStreaks)}
            size="medium"
          />
          <StatBlock label="PRs" value={String(seedPackStats.prsThisWeek)} size="medium" />
        </View>
      </Card>

      <SectionHeader title="Top Dogs" subtitle="Ranked within a single category — never across incompatible training types." />

      <View style={styles.filterGroup}>
        <View style={styles.filterRow}>
          {SCOPES.map((s) => (
            <Pill
              key={s.id}
              label={s.label}
              selected={scope === s.id}
              onPress={() => setScope(s.id)}
            />
          ))}
        </View>
        <View style={styles.filterRow}>
          {CATEGORIES.map((c) => (
            <Pill
              key={c.id}
              label={c.label}
              selected={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </View>
      </View>

      {yourPosition ? (
        <Card marker="live" style={styles.yourPosition}>
          <View style={styles.positionRow}>
            <View>
              <Text variant="overline" tone="tertiary">
                Your position
              </Text>
              <Text variant="metricL">{formatRank(yourPosition.rank)}</Text>
            </View>
            <View style={styles.positionMeta}>
              <Text variant="metricM">{yourPosition.value}</Text>
              <Pill
                label={
                  yourPosition.change > 0
                    ? `+${yourPosition.change}`
                    : yourPosition.change < 0
                      ? String(yourPosition.change)
                      : 'Holding'
                }
                tone={
                  yourPosition.change > 0
                    ? 'success'
                    : yourPosition.change < 0
                      ? 'danger'
                      : 'neutral'
                }
              />
            </View>
          </View>
        </Card>
      ) : null}

      <Card padded={false} style={styles.list}>
        {seedLeaderboard.map((entry, i) => (
          <ListRow
            key={entry.userId}
            title={entry.displayName}
            subtitle={entry.packName}
            leading={
              <Text variant="metricS" tone={entry.isCurrentUser ? 'primary' : 'tertiary'}>
                {entry.rank}
              </Text>
            }
            value={String(entry.value)}
            valueDetail={
              entry.change > 0
                ? `up ${entry.change}`
                : entry.change < 0
                  ? `down ${Math.abs(entry.change)}`
                  : 'holding'
            }
            last={i === seedLeaderboard.length - 1}
          />
        ))}
      </Card>

      <SectionHeader title="Members" />
      <Card padded={false} style={styles.list}>
        {seedPackMembers.map((member, i) => (
          <ListRow
            key={member.userId}
            title={member.displayName}
            subtitle={`${member.workoutsThisWeek} this week · ${member.currentStreak} week streak`}
            value={String(member.rabidScore)}
            valueDetail={member.role === 'member' ? undefined : member.role}
            last={i === seedPackMembers.length - 1}
          />
        ))}
      </Card>

      <SectionHeader title="The Yard" subtitle="Work, not photos." />
      {seedYardPosts.length > 0 ? (
        seedYardPosts.slice(0, 5).map((post) => (
          <Card key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Text variant="bodyStrong">{post.displayName}</Text>
              <Text variant="caption" tone="tertiary">
                {formatRelative(post.createdAt, now)}
              </Text>
            </View>
            <Text variant="h3" style={styles.postHeadline}>
              {post.headline}
            </Text>
            {post.detail ? (
              <Text variant="bodySmall" tone="secondary">
                {post.detail}
              </Text>
            ) : null}
            <View style={styles.postFooter}>
              <Text variant="caption" tone="tertiary">
                {post.reactionCount} reactions · {post.commentCount} comments
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState title="The Yard is quiet" message="Nothing logged by your Pack yet." />
      )}

      <Button label="Leave Pack" variant="ghost" onPress={confirmLeave} style={styles.leave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.lg, marginBottom: sp.xl, gap: sp.xs },
  description: { marginTop: sp.xs, marginBottom: sp.xl },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondRow: { marginTop: sp.xl },
  filterGroup: { gap: sp.sm, marginBottom: sp.lg },
  filterRow: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap' },
  yourPosition: { marginBottom: sp.md },
  positionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  positionMeta: { alignItems: 'flex-end', gap: sp.sm },
  list: { paddingHorizontal: sp.lg },
  postCard: { marginBottom: sp.md },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postHeadline: { marginTop: sp.sm, marginBottom: sp.xs },
  postFooter: { marginTop: sp.md },
  leave: { marginTop: sp.xxl },
});
