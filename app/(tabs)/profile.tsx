import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Button, Card, ListRow, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useUserStore, hasAcceptedNutritionDisclaimer } from '@/store/userStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useContractStore } from '@/store/contractStore';
import {
  SCORE_WEIGHTS, calculateRabidScore, levelLabel, nextLevel, weakestComponent,
} from '@/engines/scoring/rabidScore';
import { backend } from '@/services/backend/localBackend';
import { SEED_TODAY } from '@/data/seed';
import { formatDate } from '@/utils/format';
import type { NotificationCategory } from '@/types';

const NOTIFICATION_LABELS: Record<NotificationCategory, string> = {
  contract_deadline: 'Contract deadlines',
  streak_reminder: 'Streak reminders',
  pack_activity: 'Pack activity',
  leaderboard_movement: 'Leaderboard movement',
  nutrition_checkin: 'Weekly Feed check-in',
  challenge_updates: 'Challenge updates',
  product_news: 'Product news',
};

const COMPONENT_LABELS: Record<keyof typeof SCORE_WEIGHTS, string> = {
  consistency: 'Consistency',
  contracts: 'Contracts',
  frequency: 'Frequency',
  progression: 'Progression',
  personalRecords: 'Personal records',
  challenges: 'Challenges',
};

/**
 * PROFILE — identity, score breakdown, settings, and the privacy controls
 * UK GDPR requires (spec §60).
 *
 * The score is shown broken down rather than as a single opaque number. A score
 * nobody can explain is a score nobody trusts, and the breakdown also tells the
 * user which behaviour to change.
 */
export default function ProfileScreen() {
  const profile = useUserStore((s) => s.profile);
  const trainingProfile = useUserStore((s) => s.trainingProfile);
  const consent = useUserStore((s) => s.consent);
  const notifications = useUserStore((s) => s.notifications);
  const toggleNotification = useUserStore((s) => s.toggleNotification);
  const setProfile = useUserStore((s) => s.setProfile);
  const signOut = useUserStore((s) => s.signOut);

  const history = useWorkoutStore((s) => s.history);
  const personalRecords = useWorkoutStore((s) => s.personalRecords);
  const contracts = useContractStore((s) => s.contracts);

  const score = useMemo(
    () =>
      calculateRabidScore({
        userId: profile?.id ?? 'user',
        workouts: history,
        contracts,
        personalRecords,
        challengesCompleted: 2,
        challengesJoined: 3,
        weeklyTarget: trainingProfile?.sessionsPerWeek ?? 4,
        today: SEED_TODAY,
      }),
    [profile?.id, history, contracts, personalRecords, trainingProfile?.sessionsPerWeek],
  );

  const rung = nextLevel(score.total);
  const weakest = weakestComponent(score.breakdown);

  const [busy, setBusy] = useState(false);

  /**
   * UK GDPR right of access (spec §60): everything held about the user, in a
   * machine-readable file, handed to the native share sheet so they can actually
   * take it somewhere.
   */
  const exportData = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const data = await backend.exportUserData(profile.id);
      const file = new File(Paths.cache, `rabid-kennel-data-${profile.handle}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export your data',
        });
      }
    } catch {
      Alert.alert('Export failed', 'Your data could not be exported. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const togglePrivacy = () => {
    if (!profile) return;
    setProfile({ ...profile, isPrivate: !profile.isPrivate });
  };

  const confirmDeletion = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your training history, Contracts, body metrics, progress photos and meal plans. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;
            await backend.deleteAccount(profile.id);
            signOut();
            router.replace('/(onboarding)/welcome');
          },
        },
      ],
    );
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your logged work stays on this device until it syncs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        onPress: () => {
          signOut();
          router.replace('/(onboarding)/welcome');
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">{profile?.displayName ?? 'Profile'}</Text>
        <Text variant="bodySmall" tone="tertiary">
          @{profile?.handle} · {profile?.gym ?? 'No gym set'}
        </Text>
      </View>

      <Card>
        <View style={styles.scoreHeader}>
          <View>
            <Text variant="overline" tone="tertiary">
              Rabid Score
            </Text>
            <Text variant="metricXL">{score.total}</Text>
          </View>
          <Pill label={levelLabel(score.level)} tone="accent" />
        </View>

        {rung ? (
          <Text variant="bodySmall" tone="tertiary" style={styles.nextLevel}>
            {rung.pointsAway} points to {levelLabel(rung.level)}.
          </Text>
        ) : (
          <Text variant="bodySmall" tone="tertiary" style={styles.nextLevel}>
            Top of the ladder.
          </Text>
        )}

        <View style={styles.breakdown}>
          {(Object.keys(SCORE_WEIGHTS) as Array<keyof typeof SCORE_WEIGHTS>).map((key) => (
            <ProgressBar
              key={key}
              label={COMPONENT_LABELS[key]}
              value={`${score.breakdown[key]} / ${SCORE_WEIGHTS[key]}`}
              fraction={score.breakdown[key] / SCORE_WEIGHTS[key]}
              tone={key === weakest ? 'warning' : 'default'}
            />
          ))}
        </View>

        {score.breakdown.inactivityPenalty < 0 ? (
          <Text variant="bodySmall" tone="danger" style={styles.penalty}>
            Inactivity penalty: {score.breakdown.inactivityPenalty}
          </Text>
        ) : null}

        <Text variant="caption" tone="tertiary" style={styles.scoreNote}>
          {COMPONENT_LABELS[weakest]} is costing you the most. Algorithm version {score.version}.
        </Text>
      </Card>

      <SectionHeader title="Training" />
      <Card padded={false} style={styles.list}>
        <ListRow
          title="Primary activity"
          value={trainingProfile?.primaryActivity.replace(/_/g, ' ') ?? '—'}
        />
        <ListRow title="Experience" value={trainingProfile?.experience ?? '—'} />
        <ListRow
          title="Sessions per week"
          value={String(trainingProfile?.sessionsPerWeek ?? '—')}
        />
        <ListRow title="Goal" value={trainingProfile?.goal.replace(/_/g, ' ') ?? '—'} last />
      </Card>

      <SectionHeader title="Units" />
      <Card padded={false} style={styles.list}>
        <ListRow title="Weight" value={profile?.units.weight ?? 'kg'} />
        <ListRow title="Height" value={profile?.units.length ?? 'cm'} />
        <ListRow title="Distance" value={profile?.units.distance ?? 'km'} last />
      </Card>

      <SectionHeader title="Notifications" />
      <Card padded={false} style={styles.list}>
        {(Object.keys(NOTIFICATION_LABELS) as NotificationCategory[]).map((category, i, arr) => (
          <ListRow
            key={category}
            title={NOTIFICATION_LABELS[category]}
            last={i === arr.length - 1}
            onPress={() => toggleNotification(category)}
            trailing={
              <Pill
                label={notifications.enabled[category] ? 'On' : 'Off'}
                tone={notifications.enabled[category] ? 'success' : 'neutral'}
              />
            }
          />
        ))}
      </Card>

      <SectionHeader title="Legal" />
      <Card padded={false} style={styles.list}>
        <ListRow
          title="Terms accepted"
          value={consent?.termsVersion ?? '—'}
          subtitle={consent ? formatDate(consent.acceptedAt) : undefined}
        />
        <ListRow title="Privacy policy" value={consent?.privacyVersion ?? '—'} />
        <ListRow
          title="Nutrition disclaimer"
          value={hasAcceptedNutritionDisclaimer(consent) ? 'Accepted' : 'Not accepted'}
          subtitle={
            hasAcceptedNutritionDisclaimer(consent)
              ? undefined
              : 'Required before your first automated plan'
          }
          last
        />
      </Card>

      <SectionHeader title="Your data" subtitle="UK GDPR: you can take it with you, or delete it." />
      <Card padded={false} style={styles.list}>
        <ListRow
          title="Export my data"
          subtitle="Everything held about you, as a JSON file"
          onPress={exportData}
        />
        <ListRow
          title="Private profile"
          subtitle={
            profile?.isPrivate
              ? 'Only your Pack can see your activity'
              : 'Your activity appears on public leaderboards and The Yard'
          }
          onPress={togglePrivacy}
          trailing={
            <Pill
              label={profile?.isPrivate ? 'Private' : 'Public'}
              tone={profile?.isPrivate ? 'success' : 'neutral'}
            />
          }
          last
        />
      </Card>

      <Button
        label="Delete account"
        variant="destructive"
        onPress={confirmDeletion}
        loading={busy}
        style={styles.delete}
      />
      <Text variant="legal" tone="tertiary" center style={styles.deleteNote}>
        Deleting your account permanently removes your training history, Contracts, body
        metrics and meal plans.
      </Text>

      <Button label="Sign out" variant="ghost" onPress={confirmSignOut} style={styles.signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.lg, marginBottom: sp.xl, gap: sp.xs },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nextLevel: { marginTop: sp.sm },
  breakdown: { gap: sp.lg, marginTop: sp.xxl },
  penalty: { marginTop: sp.lg },
  scoreNote: { marginTop: sp.lg },
  list: { paddingHorizontal: sp.lg },
  delete: { marginTop: sp.xxxl },
  deleteNote: { marginTop: sp.md },
  signOut: { marginTop: sp.xl },
});
