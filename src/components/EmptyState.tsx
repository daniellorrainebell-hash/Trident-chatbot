import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { space } from '@/design';

export type EmptyStateProps = {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

/**
 * Empty states carry the product's voice without becoming a slogan wall —
 * the spec warns against overusing brand lines (§3). One short line, then
 * a way forward.
 */
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="h3" tone="secondary" center>
        {title}
      </Text>
      <Text variant="body" tone="tertiary" center style={styles.message}>
        {message}
      </Text>
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="secondary"
          size="medium"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: space.huge, paddingHorizontal: space.lg },
  message: { marginTop: space.sm, maxWidth: 320 },
  action: { marginTop: space.xl },
});
