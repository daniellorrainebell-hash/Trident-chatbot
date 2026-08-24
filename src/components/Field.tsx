import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Text } from './Text';
import { colors, radius, space, fontFamily, minTouchTarget } from '@/design';

export type FieldProps = {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  /** Unit shown inside the field, e.g. "kg". */
  suffix?: string;
  /** Validation message. Shown in the danger tone and announced. */
  error?: string;
  /** Guidance shown when there is no error. */
  hint?: string;
  multiline?: boolean;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize = 'sentences',
  suffix,
  error,
  hint,
  multiline,
}: FieldProps) {
  return (
    <View style={styles.container}>
      <Text variant="overline" tone="tertiary">
        {label}
      </Text>
      <View style={[styles.inputRow, error != null && styles.inputRowError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          style={[styles.input, multiline && styles.multiline]}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
        />
        {suffix ? (
          <Text variant="bodySmall" tone="tertiary">
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: space.lg,
    minHeight: minTouchTarget + 6,
  },
  inputRowError: { borderColor: colors.status.danger },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fontFamily.ui,
    fontSize: 16,
    paddingVertical: space.md,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
