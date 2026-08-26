import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, space, hitSlop } from '@/design';

export type SectionHeaderProps = {
  title: string;
  action?: { label: string; onPress: () => void };
  /** Small explanatory line under the title. */
  subtitle?: string;
};

export function SectionHeader({ title, action, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.titleGroup}>
          {/* A hairline, not a colour on the words. Structure carries the brand
              here; the text stays the same grey it always was. */}
          <View style={styles.tick} />
          <Text variant="overline" tone="tertiary" accessibilityRole="header">
            {title}
          </Text>
        </View>
        {action ? (
          <Pressable
            onPress={action.onPress}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text variant="overline" tone="accent">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? (
        <Text variant="bodySmall" tone="tertiary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: space.xxl, marginBottom: space.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  tick: { width: 10, height: 2, borderRadius: 1, backgroundColor: colors.brand.edge },
  subtitle: { marginTop: space.xs },
});
