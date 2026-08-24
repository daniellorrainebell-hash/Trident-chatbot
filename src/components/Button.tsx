import { useCallback } from 'react';
import {
  Pressable, StyleSheet, View, ActivityIndicator,
  type StyleProp, type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, radius, space, motion, opacity, minTouchTarget } from '@/design';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'large' | 'medium' | 'small';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Fills the width of its container. Default for primary CTAs. */
  block?: boolean;
  /** Fires a haptic on press. On by default for primary and destructive. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/**
 * Primary action is bone-on-black — the loudest element on any screen, and there
 * should only ever be one of them visible at a time.
 *
 * Every button clears the 44pt minimum target (spec §73). Small buttons get
 * vertical padding to reach it even though their text is smaller.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  block = variant === 'primary',
  haptic,
  style,
  accessibilityHint,
}: ButtonProps) {
  const shouldHaptic = haptic ?? (variant === 'primary' || variant === 'destructive');
  const isInactive = disabled || loading;

  const handlePress = useCallback(() => {
    if (isInactive) return;
    if (shouldHaptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [isInactive, onPress, shouldHaptic]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        block && styles.block,
        pressed && pressedStyles[variant],
        pressed && { transform: [{ scale: motion.scale.press }] },
        isInactive && { opacity: opacity.disabled },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.action.primaryText : colors.text.primary}
        />
      ) : (
        <View style={styles.content}>
          <Text
            variant={size === 'small' ? 'buttonSmall' : 'button'}
            tone={variant === 'primary' ? 'inverse' : 'primary'}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    minHeight: minTouchTarget,
  },
  block: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

const sizeStyles = StyleSheet.create({
  large: { paddingVertical: space.lg, paddingHorizontal: space.xxl },
  medium: { paddingVertical: space.md, paddingHorizontal: space.xl },
  small: { paddingVertical: space.sm, paddingHorizontal: space.lg, minHeight: minTouchTarget },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.action.primaryBg },
  secondary: {
    backgroundColor: colors.action.secondaryBg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: colors.action.destructiveBg },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.action.primaryPressed },
  secondary: { backgroundColor: colors.action.secondaryPressed },
  ghost: { backgroundColor: colors.bg.elevated },
  destructive: { backgroundColor: colors.action.destructivePressed },
});
