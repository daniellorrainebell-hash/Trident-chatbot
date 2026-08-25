import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { BrandMark, Button, Card, EmptyState, ListRow, Pill, Screen, SectionHeader, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { useScannerStore } from '@/store/scannerStore';
import { formatRelative } from '@/utils/format';

/**
 * FOOD SCANNER home (Feed spec §21).
 *
 * Three routes in, ordered by how often they work: barcode first, label when
 * the barcode is missing or the packaging has changed, manual when neither
 * helps. The label route is never presented as a failure state — for a lot of
 * UK products it is simply the faster path.
 */
export default function ScannerHomeScreen() {
  const myFoods = useScannerStore((s) => s.myFoods);
  const openScanner = useScannerStore((s) => s.openScanner);

  const recent = [...myFoods].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 5);

  return (
    <Screen>
      <View style={styles.head}>
        <BrandMark size="compact" hideSubmark />
        <Text variant="h1" style={styles.title}>Food Scanner</Text>
        <Text variant="body" tone="tertiary">
          See what it contains. Check how it fits. Add it to your plan.
        </Text>
      </View>

      <Button
        label="Scan barcode"
        onPress={() => {
          openScanner('barcode');
          router.push('/feed/scanner/barcode');
        }}
      />
      <Button
        label="Scan nutrition label"
        variant="secondary"
        onPress={() => {
          openScanner('label');
          router.push('/feed/scanner/label');
        }}
        style={styles.gap}
      />
      <Button
        label="Enter food manually"
        variant="ghost"
        onPress={() => {
          openScanner('manual');
          router.push('/feed/scanner/confirm');
        }}
        style={styles.gap}
      />

      <SectionHeader
        title="My Foods"
        action={myFoods.length > 0 ? { label: 'All', onPress: () => router.push('/feed/my-foods') } : undefined}
      />

      {recent.length > 0 ? (
        <Card padded={false} style={styles.list}>
          {recent.map((food, i) => (
            <ListRow
              key={food.id}
              title={food.name}
              subtitle={[food.brand, formatRelative(food.savedAt)].filter(Boolean).join(' · ')}
              value={`${Math.round(food.nutrients.kcal)}`}
              valueDetail={food.basis === 'per_serving' ? 'per serving' : 'per 100'}
              last={i === recent.length - 1}
              onPress={() => router.push('/feed/my-foods')}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Nothing saved yet"
          message="Scan something and it lands here, ready to drop into a meal or your shopping list."
        />
      )}

      <Card style={styles.notice}>
        <Text variant="overline" tone="tertiary">Allergens</Text>
        <Text variant="bodySmall" tone="secondary" style={styles.noticeBody}>
          Scanned allergen information comes from product databases and can be out of date.
          If you have a severe allergy, always check the physical packaging.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingTop: sp.lg, marginBottom: sp.xxl, gap: sp.xs },
  title: { marginTop: sp.md },
  gap: { marginTop: sp.md },
  list: { paddingHorizontal: sp.lg },
  notice: { marginTop: sp.xxl, borderColor: colors.border.default },
  noticeBody: { marginTop: sp.sm },
});
