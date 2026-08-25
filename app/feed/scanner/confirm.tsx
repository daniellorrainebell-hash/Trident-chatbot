import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Pill, Screen, SectionHeader, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { useScannerStore } from '@/store/scannerStore';
import { ALLERGEN_LABELS } from '@/engines/food/eligibility';
import { checkPlausibility, classifyByMacros, crossCheckEnergy } from '@/engines/scanner/portions';
import type { NutrientBasis } from '@/engines/scanner/label';
import { formatDate } from '@/utils/format';

const BASIS_LABELS: Record<NutrientBasis, string> = {
  per_100g: 'Per 100g',
  per_100ml: 'Per 100ml',
  per_serving: 'Per serving',
};

/**
 * CONFIRM LABEL MATCHES (Feed spec §22, §23, §24).
 *
 * The gate. Nothing from a barcode database or an OCR pass reaches a plan
 * until it has been through this screen — provider data is community-
 * contributed and packaging changes without the database noticing.
 *
 * Every value is editable. The scan is a first draft, and the packaging in the
 * user's hand is the source of truth.
 */
export default function ConfirmScanScreen() {
  const product = useScannerStore((s) => s.product);
  const pending = useScannerStore((s) => s.pendingNutrition);
  const confirmNutrition = useScannerStore((s) => s.confirmNutrition);

  const [name, setName] = useState(product?.productName ?? '');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [basis, setBasis] = useState<NutrientBasis>(pending?.basis ?? 'per_100g');
  const [kcal, setKcal] = useState(String(pending?.nutrients.kcal ?? ''));
  const [protein, setProtein] = useState(String(pending?.nutrients.protein ?? ''));
  const [carbs, setCarbs] = useState(String(pending?.nutrients.carbs ?? ''));
  const [fat, setFat] = useState(String(pending?.nutrients.fat ?? ''));
  const [servingSize, setServingSize] = useState(
    pending?.servingSizeG ? String(pending.servingSizeG) : '',
  );

  const nutrients = useMemo(
    () => ({
      kcal: Number.parseFloat(kcal) || 0,
      protein: Number.parseFloat(protein) || 0,
      carbs: Number.parseFloat(carbs) || 0,
      fat: Number.parseFloat(fat) || 0,
    }),
    [kcal, protein, carbs, fat],
  );

  const issues = checkPlausibility(nutrients, basis);
  const energyCheck = crossCheckEnergy(nutrients);
  const classification = classifyByMacros(nutrients);

  const blocking = issues.some((issue) => issue.severity === 'error');
  const servingRequired = basis === 'per_serving' && !servingSize;
  const complete = name.trim().length > 0 && nutrients.kcal > 0 && !blocking && !servingRequired;

  return (
    <Screen
      footer={
        <Button
          label="Confirm label matches"
          disabled={!complete}
          onPress={() => {
            confirmNutrition({
              basis,
              basisQuantity: basis === 'per_serving' ? Number.parseFloat(servingSize) || 1 : 100,
              nutrients,
              servingSizeG: servingSize ? Number.parseFloat(servingSize) : undefined,
              packQuantity: pending?.packQuantity,
              packUnit: pending?.packUnit,
            });
            router.push('/feed/scanner/portion');
          }}
        />
      }
    >
      <View style={styles.head}>
        <Text variant="h1">Check the label</Text>
        <Text variant="body" tone="tertiary" style={styles.lede}>
          Compare these against the packaging in your hand and correct anything that is wrong.
        </Text>
      </View>

      {product ? (
        <Card>
          <View style={styles.rowTop}>
            <Text variant="overline" tone="tertiary">Source</Text>
            <Pill label="Unverified" tone="warning" />
          </View>
          <Text variant="bodySmall" tone="secondary" style={styles.gap}>
            {product.provider === 'open_food_facts' ? 'Open Food Facts' : product.provider}
            {product.lastModifiedAt ? ` · updated ${formatDate(product.lastModifiedAt)}` : ''}
          </Text>
          {product.attribution ? (
            <Text variant="legal" tone="tertiary" style={styles.gap}>{product.attribution}</Text>
          ) : null}
        </Card>
      ) : null}

      <SectionHeader title="Product" />
      <Card>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Porridge oats" />
        <View style={styles.gapLarge}>
          <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Optional" />
        </View>
      </Card>

      <SectionHeader title="These figures are" />
      <View style={styles.basisRow}>
        {(Object.keys(BASIS_LABELS) as NutrientBasis[]).map((option) => (
          <Pill
            key={option}
            label={BASIS_LABELS[option]}
            selected={basis === option}
            onPress={() => setBasis(option)}
          />
        ))}
      </View>

      {basis === 'per_serving' ? (
        <Card style={styles.gap}>
          <Field
            label="Serving weight"
            value={servingSize}
            onChangeText={setServingSize}
            keyboardType="decimal-pad"
            suffix="g"
            hint="Needed before this food can be measured in grams."
            error={servingRequired ? 'Enter the serving weight from the packaging.' : undefined}
          />
        </Card>
      ) : null}

      <SectionHeader title="Nutrition" />
      <Card>
        <Field label="Energy" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" suffix="kcal" />
        <View style={styles.gapLarge}>
          <Field label="Protein" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" suffix="g" />
        </View>
        <View style={styles.gapLarge}>
          <Field label="Carbohydrate" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" suffix="g" />
        </View>
        <View style={styles.gapLarge}>
          <Field label="Fat" value={fat} onChangeText={setFat} keyboardType="decimal-pad" suffix="g" />
        </View>
      </Card>

      {issues.length > 0 ? (
        <Card marker="danger" style={styles.gap}>
          <Text variant="overline" tone="danger">Check these</Text>
          {issues.map((issue) => (
            <Text key={issue.field} variant="bodySmall" tone="secondary" style={styles.gap}>
              {issue.message}
            </Text>
          ))}
        </Card>
      ) : null}

      {energyCheck.mismatch ? (
        <Card marker="warning" style={styles.gap}>
          <Text variant="overline" tone="warning">Energy does not match the macros</Text>
          <Text variant="bodySmall" tone="secondary" style={styles.gap}>
            {energyCheck.message} The macros here work out to about {energyCheck.estimateKcal} kcal.
          </Text>
          <Text variant="legal" tone="tertiary" style={styles.gap}>
            Fibre and rounding can explain small differences, so the printed value is kept as you entered it.
          </Text>
        </Card>
      ) : null}

      {product && product.declaredAllergens.length > 0 ? (
        <>
          <SectionHeader title="Declared allergens" />
          <Card>
            <View style={styles.allergens}>
              {product.declaredAllergens.map((allergen) => (
                <Pill key={allergen} label={ALLERGEN_LABELS[allergen]} tone="warning" />
              ))}
            </View>
            <Text variant="legal" tone="tertiary" style={styles.gapLarge}>
              Taken from a product database and not a guarantee. If you have a severe allergy,
              check the physical packaging.
            </Text>
          </Card>
        </>
      ) : null}

      <SectionHeader title="Category" />
      <Card>
        <View style={styles.allergens}>
          {classification.tags.map((tag) => (
            <Pill key={tag} label={tag} tone="accent" />
          ))}
        </View>
        <Text variant="caption" tone="tertiary" style={styles.gapLarge}>
          Worked out from where the energy comes from. You can change it after saving.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: sp.lg, marginBottom: sp.xl },
  lede: { marginTop: sp.sm },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gap: { marginTop: sp.sm },
  gapLarge: { marginTop: sp.lg },
  basisRow: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap' },
  allergens: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap' },
});
