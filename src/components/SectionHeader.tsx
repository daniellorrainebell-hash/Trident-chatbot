import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { space, hitSlop } from '@/design';

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
        <Text variant="overline" tone="tertiary" accessibilityRole="header">
          {title}
        </Text>
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
  subtitle: { marginTop: space.xs },
});
