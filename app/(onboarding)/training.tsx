import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, ChoiceGroup, Screen, SectionHeader, Text, type Choice,
} from '@/components';
import { space as sp } from '@/design';
import { useUserStore } from '@/store/userStore';
import { track } from '@/services/analytics';
import type { PrimaryActivity, TrainingExperience, TrainingGoal } from '@/types';

const ACTIVITIES: Array<Choice<PrimaryActivity>> = [
  { value: 'bodybuilding', label: 'Bodybuilding' },
  { value: 'strength', label: 'Strength' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'mma', label: 'MMA' },
  { value: 'kickboxing_muay_thai', label: 'Kickboxing / Muay Thai' },
  { value: 'cross_training', label: 'Cross training' },
  { value: 'running', label: 'Running' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'general_fitness', label: 'General fitness' },
];

const EXPERIENCE: Array<Choice<TrainingExperience>> = [
  { value: 'new', label: 'New to training' },
  { value: 'novice', label: '6–18 months' },
  { value: 'intermediate', label: '1.5–3 years' },
  { value: 'advanced', label: '3–5 years' },
  { value: 'veteran', label: '5+ years' },
];

const GOALS: Array<Choice<TrainingGoal>> = [
  { value: 'lose_body_fat', label: 'Lose body fat' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'maintain_recomp', label: 'Maintain / recomp' },
  { value: 'improve_strength', label: 'Get stronger' },
  { value: 'improve_conditioning', label: 'Improve conditioning' },
  { value: 'sports_performance', label: 'Sports performance' },
  { value: 'fight_preparation', label: 'Fight preparation' },
  { value: 'be_consistent', label: 'Become consistent' },
];

const SESSIONS = ['2', '3', '4', '5', '6'].map((v) => ({ value: v, label: `${v}/week` }));

/**
 * Training profile (spec §9).
 *
 * Sessions per week is the important field: it becomes the streak target and the
 * denominator for the Rabid Score's consistency and frequency components. The
 * user is measured against their own commitment, not a fixed number, which is
 * why it is set here rather than assumed.
 */
export default function OnboardingTrainingScreen() {
  const setTrainingProfile = useUserStore((s) => s.setTrainingProfile);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const profile = useUserStore((s) => s.profile);

  const [activity, setActivity] = useState<PrimaryActivity>('hybrid');
  const [experience, setExperience] = useState<TrainingExperience>('intermediate');
  const [goal, setGoal] = useState<TrainingGoal>('improve_strength');
  const [sessions, setSessions] = useState('4');

  const handleFinish = () => {
    setTrainingProfile({
      userId: profile?.id ?? 'user',
      primaryActivity: activity,
      experience,
      goal,
      sessionsPerWeek: Number.parseInt(sessions, 10),
      averageSessionMinutes: 70,
      perceivedIntensity: 3,
      dailyActivityLevel: 'moderately_active',
    });

    completeOnboarding();
    track({ name: 'onboarding_complete', properties: { primaryActivity: activity, goal } });
    router.replace('/kennel');
  };

  return (
    <Screen footer={<Button label="Enter The Kennel" onPress={handleFinish} />}>
      <View style={styles.header}>
        <Text variant="h1">How do you train?</Text>
        <Text variant="body" tone="tertiary">
          This shapes your targets and how your consistency is measured.
        </Text>
      </View>

      <SectionHeader title="Primary activity" />
      <ChoiceGroup<PrimaryActivity>
        choices={ACTIVITIES}
        selected={activity}
        onSelect={setActivity}
        layout="inline"
      />

      <SectionHeader title="How long have you trained?" />
      <ChoiceGroup<TrainingExperience>
        choices={EXPERIENCE}
        selected={experience}
        onSelect={setExperience}
        layout="inline"
      />

      <SectionHeader
        title="Sessions per week"
        subtitle="Your streak and your score are measured against this, not against anyone else's number."
      />
      <ChoiceGroup choices={SESSIONS} selected={sessions} onSelect={setSessions} layout="inline" />

      <SectionHeader title="Main goal" />
      <ChoiceGroup<TrainingGoal> choices={GOALS} selected={goal} onSelect={setGoal} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.xxl, marginBottom: sp.lg, gap: sp.xs },
});
