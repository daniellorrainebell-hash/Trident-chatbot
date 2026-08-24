import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius, space, minTouchTarget } from '@/design';

export type Choice<T extends string> = {
  value: T;
  label: string;
  /** Explanatory line under the label, for onboarding questions. */
  detail?: string;
};

export type ChoiceGroupProps<T extends string> = {
  label?: string;
  choices: Array<Choice<T>>;
  selected: T | T[] | null;
  onSelect(value: T): void;
  multi?: boolean;
  /** Side-by-side chips instead of stacked rows. For short options. */
  layout?: 'stack' | 'inline';
};

/**
 * Radio and multi-select control used throughout onboarding and The Feed.
 *
 * Selection is marked by fill *and* a check glyph, never by colour alone (spec §73).
 */
export function ChoiceGroup<T extends string>({
  label,
  choices,
  selected,
  onSelect,
  multi = false,
  layout = 'stack',
}: ChoiceGroupProps<T>) {
  const isSelected = (value: T): boolean =>
    Array.isArray(selected) ? selected.includes(value) : selected === value;

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="overline" tone="tertiary">
          {label}
        </Text>
      ) : null}
      <View style={layout === 'inline' ? styles.inline : styles.stack}>
        {choices.map((choice) => {
          const active = isSelected(choice.value);
          return (
            <Pressable
              key={choice.value}
              onPress={() => onSelect(choice.value)}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={{ selected: active, checked: active }}
              accessibilityLabel={choice.label}
              accessibilityHint={choice.detail}
              style={({ pressed }) => [
                styles.choice,
                layout === 'inline' && styles.choiceInline,
                active && styles.choiceActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.choiceBody}>
                <Text variant="bodyStrong" tone={active ? 'primary' : 'secondary'}>
                  {choice.label}
                </Text>
                {choice.detail ? (
                  <Text variant="caption" tone="tertiary">
                    {choice.detail}
                  </Text>
                ) : null}
              </View>
              {active ? (
                <Text variant="bodyStrong" tone="primary">
                  ✓
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.md },
  stack: { gap: space.sm },
  inline: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    backgroundColor: colors.bg.raised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: minTouchTarget,
  },
  choiceInline: { flexGrow: 1, flexBasis: '45%' },
  choiceActive: { borderColor: colors.text.primary, backgroundColor: colors.bg.elevated },
  choiceBody: { flex: 1, gap: space.xxs },
  pressed: { opacity: 0.75 },
});
