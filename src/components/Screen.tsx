import type { ReactNode } from 'react';
import {
  ScrollView, StyleSheet, View, RefreshControl,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, layout, space } from '@/design';

export type ScreenProps = {
  children: ReactNode;
  /** Scrolling is the default; pass false for a screen that manages its own list. */
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Rendered outside the scroll view, pinned to the bottom. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Screen shell: safe areas, background, and enough bottom padding that content
 * clears the tab bar and the home indicator.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  onRefresh,
  refreshing = false,
  footer,
  contentStyle,
}: ScreenProps) {
  const inner = (
    <View style={[padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.text.tertiary}
              />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{inner}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  padded: { paddingHorizontal: layout.screenPadding },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.md,
    paddingBottom: space.lg,
    backgroundColor: colors.bg.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
