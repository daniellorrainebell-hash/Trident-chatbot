import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from '@/components';
import { colors, space } from '@/design';

/**
 * Five tabs, named in the product's own language (spec §10, §3).
 *
 * No icon set: the tab labels are the brand vocabulary, and a condensed
 * uppercase wordmark carries more identity here than a generic dumbbell glyph
 * would — the spec explicitly rules those out (§2).
 */
function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.label}>
      <Text variant="tabLabel" tone={focused ? 'primary' : 'tertiary'}>
        {label}
      </Text>
      {/* Active state is marked by the rule as well as the colour (spec §73). */}
      <View style={[styles.marker, focused && styles.markerActive]} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarShowLabel: true,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Tabs.Screen
        name="kennel"
        options={{
          title: 'Kennel',
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => <TabLabel label="Kennel" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => <TabLabel label="Train" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pack"
        options={{
          title: 'Pack',
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => <TabLabel label="Pack" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => <TabLabel label="Record" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.bg.void,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: space.sm,
  },
  item: { paddingVertical: space.xs },
  label: { alignItems: 'center', gap: space.xs },
  marker: { height: 2, width: 18, backgroundColor: 'transparent', borderRadius: 1 },
  // The one persistent piece of brand colour in the app. It marks position,
  // never state, so it cannot be mistaken for a warning.
  markerActive: { backgroundColor: colors.brand.edge },
});
