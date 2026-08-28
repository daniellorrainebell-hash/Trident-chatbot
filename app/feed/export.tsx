import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button, Card, EmptyState, ListRow, Screen, SectionHeader, Text } from '@/components';
import { space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { buildWorkbookBase64, suggestedFilename } from '@/services/nutrition/excelExport';
import { buildMealPrep } from '@/services/nutrition/planBuilder';
import { track } from '@/services/analytics';

const SHEETS = [
  { name: 'Targets & Profile', detail: 'Your figures, how they were calculated, and the disclaimer' },
  { name: 'Weekly Plan', detail: 'Every selected meal across the seven days' },
  { name: 'Daily Macros', detail: 'Plan against target, day by day' },
  { name: 'Meal Options', detail: 'All three choices for every meal' },
  { name: 'Recipes', detail: 'Ingredients, quantities and method' },
  { name: 'Shopping List', detail: 'Grouped by aisle' },
  { name: 'Meal Prep', detail: 'Batch quantities' },
];

/**
 * Excel export (spec §48).
 *
 * Generates a real workbook, writes it to the cache directory, then hands it to
 * the native share sheet — which is what makes this a native capability rather
 * than a browser download (spec §84).
 */
export default function ExportScreen() {
  const plan = useNutritionStore((s) => s.plan);
  const energy = useNutritionStore((s) => s.energy);
  const profile = useNutritionStore((s) => s.profile);
  const shoppingList = useNutritionStore((s) => s.shoppingList);
  const userProfile = useUserStore((s) => s.profile);

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!plan || !energy || !profile || !shoppingList) return;

    setExporting(true);
    setError(null);

    try {
      const base64 = buildWorkbookBase64({
        plan,
        energy,
        profile,
        shoppingList,
        mealPrep: buildMealPrep(plan, 7),
        displayName: userProfile?.displayName ?? 'Athlete',
        disclaimerText:
          'The Kennel nutrition and meal-planning features are provided for general fitness, educational and informational purposes only. They are not medical advice, diagnosis, treatment or a substitute for advice from a doctor, registered dietitian or other appropriately qualified healthcare professional. Calorie, macronutrient, weight-change and timeframe calculations are estimates based on the information you provide. Individual results vary and cannot be guaranteed.',
      });

      // Cache rather than documents: the workbook is a hand-off to the share
      // sheet, not something the app needs to keep.
      const file = new File(Paths.cache, suggestedFilename(plan));
      if (file.exists) file.delete();
      file.create();
      file.write(base64, { encoding: 'base64' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export your plan',
          UTI: 'org.openxmlformats.spreadsheetml.sheet',
        });
      }

      track({ name: 'plan_exported', properties: { format: 'xlsx' } });
    } catch (cause) {
      // Surface the failure rather than leaving a spinner spinning. The cause
      // goes to the log too — writing a file and opening a share sheet fails
      // for device-specific reasons, and a swallowed error is undiagnosable.
      console.warn('[export] workbook failed', cause);
      setError('The workbook could not be created. Try regenerating your plan.');
    } finally {
      setExporting(false);
    }
  };

  if (!plan || !energy) {
    return (
      <Screen>
        <EmptyState
          title="Nothing to export"
          message="Generate a meal plan first."
          action={{ label: 'Build a plan', onPress: () => router.replace('/feed/plan') }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label="Generate and share"
          onPress={handleExport}
          loading={exporting}
        />
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Export</Text>
        <Text variant="body" tone="tertiary">
          A formatted Excel workbook you can print, edit or send to a coach.
        </Text>
      </View>

      {error ? (
        <Card marker="danger">
          <Text variant="bodySmall" tone="danger">
            {error}
          </Text>
        </Card>
      ) : null}

      <SectionHeader title="What's in the file" />
      <Card padded={false} style={styles.list}>
        {SHEETS.map((sheet, i) => (
          <ListRow
            key={sheet.name}
            title={sheet.name}
            subtitle={sheet.detail}
            last={i === SHEETS.length - 1}
          />
        ))}
      </Card>

      <SectionHeader title="File" />
      <Card>
        <Text variant="bodyStrong">{suggestedFilename(plan)}</Text>
        <Text variant="caption" tone="tertiary" style={styles.fileNote}>
          Genuine .xlsx. Opens in Excel, Numbers, Google Sheets and LibreOffice.
        </Text>
      </Card>

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        The workbook includes the equation and safety policy versions used to produce your
        targets, and the nutrition disclaimer. An exported file outlives the screen it came
        from, so it carries its own context.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  list: { paddingHorizontal: sp.lg },
  fileNote: { marginTop: sp.xs },
  footer: { marginTop: sp.xxl },
});
