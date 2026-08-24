import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, ChoiceGroup, Field, Screen, SectionHeader, Text, type Choice,
} from '@/components';
import { space as sp } from '@/design';
import { useUserStore } from '@/store/userStore';
import type { UnitPreferences, WeightUnit, LengthUnit, DistanceUnit } from '@/types';

/**
 * Core profile and units (spec §9).
 *
 * Kept short. Onboarding that asks for everything up front is onboarding people
 * abandon; anything not needed to make the first session useful is collected
 * later, at the point it matters.
 */
export default function OnboardingProfileScreen() {
  const profile = useUserStore((s) => s.profile);
  const setUnits = useUserStore((s) => s.setUnits);

  const [displayName, setDisplayName] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('cm');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');

  const valid = displayName.trim().length >= 2;

  const handleContinue = () => {
    if (!valid) return;
    const units: UnitPreferences = {
      weight: weightUnit,
      length: lengthUnit,
      distance: distanceUnit,
    };
    setUnits(units);
    if (profile) {
      useUserStore.getState().setProfile({ ...profile, displayName: displayName.trim(), units });
    }
    router.push('/(onboarding)/training');
  };

  return (
    <Screen footer={<Button label="Continue" onPress={handleContinue} disabled={!valid} />}>
      <View style={styles.header}>
        <Text variant="h1">Who are you?</Text>
        <Text variant="body" tone="tertiary">
          This is the name your Pack sees.
        </Text>
      </View>

      <Field
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        autoCapitalize="words"
      />

      <SectionHeader
        title="Units"
        subtitle="Everything is stored the same way underneath, so you can change this whenever you like."
      />

      <View style={styles.units}>
        <ChoiceGroup<WeightUnit>
          label="Weight"
          choices={[{ value: 'kg', label: 'Kilograms' }, { value: 'lb', label: 'Pounds' }]}
          selected={weightUnit}
          onSelect={setWeightUnit}
          layout="inline"
        />
        <ChoiceGroup<LengthUnit>
          label="Height"
          choices={[{ value: 'cm', label: 'Centimetres' }, { value: 'in', label: 'Feet & inches' }]}
          selected={lengthUnit}
          onSelect={setLengthUnit}
          layout="inline"
        />
        <ChoiceGroup<DistanceUnit>
          label="Distance"
          choices={[{ value: 'km', label: 'Kilometres' }, { value: 'mi', label: 'Miles' }]}
          selected={distanceUnit}
          onSelect={setDistanceUnit}
          layout="inline"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.xxl, marginBottom: sp.xl, gap: sp.xs },
  units: { gap: sp.xxl },
});
