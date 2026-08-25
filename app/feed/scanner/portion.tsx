import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Pill, Screen, SectionHeader, StatBlock, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { useScannerStore } from '@/store/scannerStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { calculatePortion, remainingAfter, type PortionRequest } from '@/engines/scanner/portions';
import { classifyByMacros } from '@/engines/scanner/portions';

/**
 * Portion and impact (Feed spec §25, §27, §28).
 *
 * A product is never judged good or bad. The screen shows what the chosen
 * portion contains and what it leaves against the day — and it insists on a
 * portion, because "the whole pack fits in your remaining calories" is not the
 * same as "this is a sensible amount to eat".
 */
export default function PortionScreen() {
  const pending = useScannerStore((s) => s.pendingNutrition);
  const product = useScannerStore((s) => s.product);
  const saveToMyFoods = useScannerStore((s) => s.saveToMyFoods);
  const reset = useScannerStore((s) => s.reset);
  const energy = useNutritionStore((s) => s.energy);

  const [amount, setAmount] = useState('100');
  const [kind, setKind] = useState<PortionRequest['kind']>('grams');

  const request = useMemo((): PortionRequest => {
    const value = Number.parseFloat(amount) || 0;
    switch (kind) {
      case 'grams': return { kind: 'grams', grams: value };
      case 'millilitres': return { kind: 'millilitres', millilitres: value };
      case 'servings': return { kind: 'servings', servings: value };
      case 'whole_pack': return { kind: 'whole_pack' };
    }
  }, [amount, kind]);

  const result = pending ? calculatePortion(pending, request) : null;

  const remaining = useMemo(() => {
    if (!energy || !result?.ok) return null;
    // Against the full daily target — a real build subtracts what is already logged.
    return remainingAfter(
      {
        kcal: energy.macros.calories,
        protein: energy.macros.proteinG,
        carbs: energy.macros.carbsG,
        fat: energy.macros.fatG,
      },
      result.nutrients,
    );
  }, [energy, result]);

  if (!pending) {
    router.replace('/feed/scanner');
    return null;
  }

  const availableKinds: Array<{ kind: PortionRequest['kind']; label: string }> = [
    { kind: 'grams', label: 'Grams' },
    ...(pending.basis === 'per_100ml' ? [{ kind: 'millilitres' as const, label: 'Millilitres' }] : []),
    { kind: 'servings', label: 'Servings' },
    ...(pending.packQuantity ? [{ kind: 'whole_pack' as const, label: 'Whole pack' }] : []),
  ];

  return (
    <Screen
      footer={
        <>
          <Button
            label="Save to My Foods"
            disabled={!result?.ok}
            onPress={() => {
              saveToMyFoods({
                name: product?.productName ?? 'Scanned food',
                brand: product?.brand,
                gtin: product?.gtin,
                basis: pending.basis,
                nutrients: pending.nutrients,
                servingSizeG: pending.servingSizeG,
                packQuantity: pending.packQuantity,
                packUnit: pending.packUnit,
                source: product ? 'barcode' : 'label',
                verificationStatus: 'user_confirmed',
                categoryTags: classifyByMacros(pending.nutrients).tags,
              });
              reset();
              router.replace('/feed/my-foods');
            }}
          />
          <Button
            label="Scan again"
            variant="ghost"
            onPress={() => { reset(); router.replace('/feed/scanner'); }}
            style={styles.gap}
          />
        </>
      }
    >
      <View style={styles.head}>
        <Text variant="h1">{product?.productName ?? 'Your food'}</Text>
        {product?.brand ? (
          <Text variant="body" tone="tertiary" style={styles.gap}>{product.brand}</Text>
        ) : null}
      </View>

      <SectionHeader title="How much" />
      <View style={styles.kinds}>
        {availableKinds.map((option) => (
          <Pill
            key={option.kind}
            label={option.label}
            selected={kind === option.kind}
            onPress={() => setKind(option.kind)}
          />
        ))}
      </View>

      {kind !== 'whole_pack' ? (
        <Card style={styles.gap}>
          <Field
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            suffix={kind === 'grams' ? 'g' : kind === 'millilitres' ? 'ml' : 'servings'}
          />
        </Card>
      ) : null}

      {result && !result.ok ? (
        <Card marker="warning" style={styles.gap}>
          <Text variant="h3">Cannot work that out yet</Text>
          <Text variant="bodySmall" tone="secondary" style={styles.gap}>{result.detail}</Text>
        </Card>
      ) : null}

      {result?.ok ? (
        <>
          <SectionHeader title="Your portion" />
          <Card>
            <Text variant="overline" tone="tertiary">{result.describedAs}</Text>
            <Text variant="metricL" style={styles.gap}>
              {Math.round(result.nutrients.kcal)}
              <Text variant="bodySmall" tone="tertiary"> kcal</Text>
            </Text>
            <View style={styles.macros}>
              <StatBlock label="Protein" value={`${Math.round(result.nutrients.protein)}`} unit="g" size="small" />
              <StatBlock label="Carbs" value={`${Math.round(result.nutrients.carbs)}`} unit="g" size="small" />
              <StatBlock label="Fat" value={`${Math.round(result.nutrients.fat)}`} unit="g" size="small" />
            </View>
          </Card>

          {remaining ? (
            <>
              <SectionHeader title="After adding" />
              <Card marker={remaining.kcal < 0 ? 'warning' : 'none'}>
                <Text variant="metricL">
                  {Math.round(remaining.kcal)}
                  <Text variant="bodySmall" tone="tertiary"> kcal left</Text>
                </Text>
                <View style={styles.macros}>
                  <StatBlock label="Protein" value={`${Math.round(remaining.protein)}`} unit="g" size="small" />
                  <StatBlock label="Carbs" value={`${Math.round(remaining.carbs)}`} unit="g" size="small" />
                  <StatBlock label="Fat" value={`${Math.round(remaining.fat)}`} unit="g" size="small" />
                </View>
                {remaining.kcal < 0 ? (
                  <Text variant="bodySmall" tone="warning" style={styles.divider}>
                    That takes you past today's target. Which is information, not a verdict.
                  </Text>
                ) : null}
              </Card>
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: sp.lg, marginBottom: sp.xl },
  gap: { marginTop: sp.sm },
  kinds: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap' },
  macros: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp.lg },
  divider: {
    marginTop: sp.md,
    paddingTop: sp.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
