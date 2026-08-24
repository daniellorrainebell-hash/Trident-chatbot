import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ChoiceGroup, Field, Screen, SectionHeader, Text, type Choice,
} from '@/components';
import { space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { track } from '@/services/analytics';
import type { ActivityLevel, NutritionGoal, Sex } from '@/types';

const GOALS: Array<Choice<NutritionGoal>> = [
  { value: 'lose_body_fat', label: 'Lose body fat', detail: 'A controlled deficit.' },
  { value: 'build_muscle', label: 'Build muscle', detail: 'A modest surplus alongside training.' },
  { value: 'maintain_recomp', label: 'Maintain / recomp', detail: 'Hold weight, change composition.' },
];

const ACTIVITY: Array<Choice<ActivityLevel>> = [
  { value: 'sedentary', label: 'Sedentary', detail: 'Desk job, little movement outside training.' },
  { value: 'lightly_active', label: 'Lightly active', detail: 'On your feet some of the day.' },
  { value: 'moderately_active', label: 'Moderately active', detail: 'Active job or a lot of walking.' },
  { value: 'very_active', label: 'Very active', detail: 'Physical job, on your feet all day.' },
  { value: 'extremely_active', label: 'Extremely active', detail: 'Heavy manual work.' },
];

const SEX: Array<Choice<Sex>> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

/**
 * Nutrition profile (spec §28).
 *
 * Collects only what the energy equations and the safety policy actually need.
 * The health questions at the bottom exist to route people away from an
 * automated planner where one is not appropriate (spec §33) — they are asked
 * plainly, without diagnosis language, and they gate the calculation entirely.
 *
 * Sex is collected because the BMR equations require it. That is the only reason,
 * and the field says so.
 */
export default function NutritionProfileScreen() {
  const existing = useNutritionStore((s) => s.profile);
  const setProfile = useNutritionStore((s) => s.setProfile);
  const generateTargets = useNutritionStore((s) => s.generateTargets);

  const [sex, setSex] = useState<Sex>(existing?.sex ?? 'male');
  const [age, setAge] = useState(String(existing?.ageYears ?? ''));
  const [height, setHeight] = useState(String(existing?.heightCm ?? ''));
  const [weight, setWeight] = useState(String(existing?.currentWeightKg ?? ''));
  const [targetWeight, setTargetWeight] = useState(String(existing?.targetWeightKg ?? ''));
  const [timeframe, setTimeframe] = useState(String(existing?.requestedTimeframeWeeks ?? ''));
  const [goal, setGoal] = useState<NutritionGoal>(existing?.goal ?? 'lose_body_fat');
  const [activity, setActivity] = useState<ActivityLevel>(
    existing?.activityLevel ?? 'moderately_active',
  );
  const [mealsPerDay, setMealsPerDay] = useState(String(existing?.mealsPerDay ?? 4));

  const [isPregnant, setIsPregnant] = useState(existing?.isPregnant ?? false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(existing?.isBreastfeeding ?? false);
  const [hasEdHistory, setHasEdHistory] = useState(existing?.hasEatingDisorderHistory ?? false);
  const [hasMedical, setHasMedical] = useState(existing?.hasMedicalCondition ?? false);

  const ageNum = Number.parseInt(age, 10);
  const heightNum = Number.parseFloat(height);
  const weightNum = Number.parseFloat(weight);

  const valid =
    Number.isFinite(ageNum) && ageNum > 0 &&
    Number.isFinite(heightNum) && heightNum > 0 &&
    Number.isFinite(weightNum) && weightNum > 0;

  const handleContinue = () => {
    if (!valid) return;

    setProfile({
      userId: existing?.userId ?? 'user',
      sex,
      ageYears: ageNum,
      heightCm: heightNum,
      currentWeightKg: weightNum,
      bodyFatPercent: null,
      activityLevel: activity,
      trainingSessionsPerWeek: existing?.trainingSessionsPerWeek ?? 4,
      averageSessionMinutes: existing?.averageSessionMinutes ?? 70,
      experience: existing?.experience ?? 'intermediate',
      goal,
      targetWeightKg: targetWeight ? Number.parseFloat(targetWeight) : null,
      requestedTimeframeWeeks: timeframe ? Number.parseInt(timeframe, 10) : null,
      mealsPerDay: Number.parseInt(mealsPerDay, 10) || 4,
      isPregnant,
      isBreastfeeding,
      hasEatingDisorderHistory: hasEdHistory,
      hasMedicalCondition: hasMedical,
    });

    const decision = generateTargets();
    if (!decision.approved) {
      track({ name: 'nutrition_blocked', properties: { kind: decision.kind } });
      router.replace('/feed');
      return;
    }

    router.push('/feed/targets');
  };

  return (
    <Screen
      footer={<Button label="Calculate my targets" onPress={handleContinue} disabled={!valid} />}
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">About you</Text>
        <Text variant="body" tone="tertiary">
          These figures feed a calculation, not a guess.
        </Text>
      </View>

      <SectionHeader title="Your goal" />
      <ChoiceGroup<NutritionGoal> choices={GOALS} selected={goal} onSelect={setGoal} />

      <SectionHeader title="Basics" />
      <View style={styles.fields}>
        <ChoiceGroup<Sex>
          label="Sex (used by the energy equation)"
          choices={SEX}
          selected={sex}
          onSelect={setSex}
          layout="inline"
        />
        <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" suffix="years" />
        <Field label="Height" value={height} onChangeText={setHeight} keyboardType="decimal-pad" suffix="cm" />
        <Field label="Current weight" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="kg" />
        {goal !== 'maintain_recomp' ? (
          <>
            <Field
              label="Target weight"
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="decimal-pad"
              suffix="kg"
              hint="Optional. Leave blank and The Kennel uses a supported default rate."
            />
            <Field
              label="Timeframe"
              value={timeframe}
              onChangeText={setTimeframe}
              keyboardType="number-pad"
              suffix="weeks"
              hint="If this is faster than The Kennel supports, you will be shown the earliest supported date."
            />
          </>
        ) : null}
      </View>

      <SectionHeader title="Daily activity" subtitle="Outside your training, not including it." />
      <ChoiceGroup<ActivityLevel> choices={ACTIVITY} selected={activity} onSelect={setActivity} />

      <SectionHeader title="Meals per day" />
      <ChoiceGroup
        choices={[
          { value: '3', label: '3 meals' },
          { value: '4', label: '4 meals' },
          { value: '5', label: '5 meals' },
          { value: '6', label: '6 meals' },
        ]}
        selected={mealsPerDay}
        onSelect={setMealsPerDay}
        layout="inline"
      />

      <SectionHeader
        title="A few health questions"
        subtitle="These decide whether an automated planner is the right tool for you. The Kennel does not diagnose anything."
      />
      <Card>
        <ChoiceGroup
          label="Are you pregnant?"
          choices={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
          selected={isPregnant ? 'yes' : 'no'}
          onSelect={(v) => setIsPregnant(v === 'yes')}
          layout="inline"
        />
        <View style={styles.questionSpacer} />
        <ChoiceGroup
          label="Are you breastfeeding?"
          choices={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
          selected={isBreastfeeding ? 'yes' : 'no'}
          onSelect={(v) => setIsBreastfeeding(v === 'yes')}
          layout="inline"
        />
        <View style={styles.questionSpacer} />
        <ChoiceGroup
          label="Do you have an eating disorder, or a history of disordered eating?"
          choices={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
          selected={hasEdHistory ? 'yes' : 'no'}
          onSelect={(v) => setHasEdHistory(v === 'yes')}
          layout="inline"
        />
        <View style={styles.questionSpacer} />
        <ChoiceGroup
          label="Do you have a medical condition, or take medication, that affects your nutritional needs?"
          choices={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
          selected={hasMedical ? 'yes' : 'no'}
          onSelect={(v) => setHasMedical(v === 'yes')}
          layout="inline"
        />
      </Card>

      <Text variant="legal" tone="tertiary" style={styles.note}>
        If any of these apply, The Kennel will not generate an automated plan and will
        point you towards an appropriately qualified professional instead.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  fields: { gap: sp.xl },
  questionSpacer: { height: sp.xl },
  note: { marginTop: sp.xl },
});
