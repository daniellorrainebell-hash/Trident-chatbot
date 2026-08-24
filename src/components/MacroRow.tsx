import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, space } from '@/design';
import type { MealNutrients } from '@/types';

export type MacroRowProps = {
  nutrients: MealNutrients;
  /** When present, each macro shows actual against target. */
  target?: MealNutrients;
  size?: 'small' | 'medium';
  showFibre?: boolean;
};

/**
 * Protein / carbs / fat, with calories above.
 *
 * Where a target is supplied the row shows "191 / 190" rather than a percentage:
 * the spec is explicit about not implying single-calorie precision (§41), and a
 * pair of real numbers is honest in a way "100.5% of target" is not.
 */
export function MacroRow({ nutrients, target, size = 'medium', showFibre = false }: MacroRowProps) {
  const items = [
    { key: 'P', value: nutrients.proteinG, targetValue: target?.proteinG },
    { key: 'C', value: nutrients.carbsG, targetValue: target?.carbsG },
    { key: 'F', value: nutrients.fatG, targetValue: target?.fatG },
    ...(showFibre ? [{ key: 'Fb', value: nutrients.fibreG, targetValue: target?.fibreG }] : []),
  ];

  return (
    <View>
      <View style={styles.calorieRow}>
        <Text variant={size === 'small' ? 'metricS' : 'metricM'}>
          {Math.round(nutrients.calories).toLocaleString('en-GB')}
        </Text>
        <Text variant="bodySmall" tone="tertiary">
          {target ? `/ ${Math.round(target.calories).toLocaleString('en-GB')} kcal` : 'kcal'}
        </Text>
      </View>

      <View style={styles.macros}>
        {items.map((item) => (
          <View key={item.key} style={styles.macro}>
            <Text variant="overline" tone="tertiary">
              {item.key}
            </Text>
            <Text variant={size === 'small' ? 'bodySmall' : 'bodyStrong'}>
              {Math.round(item.value)}
              {item.targetValue != null ? (
                <Text variant="caption" tone="tertiary">
                  {` / ${Math.round(item.targetValue)}`}
                </Text>
              ) : null}
              <Text variant="caption" tone="tertiary">g</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  macros: { flexDirection: 'row', gap: space.xl, marginTop: space.sm },
  macro: { gap: space.xxs },
});
