import * as XLSX from 'xlsx';
import { makeNutritionProfile } from '@/engines/__fixtures__/builders';
import { calculateEnergyTargets } from '@/engines/nutrition/energy';
import { localMealProvider } from '@/services/ai/localProvider';
import { seedFoodPreferences } from '@/data/seed';
import { buildMealPlan, buildShoppingList, buildMealPrep } from './planBuilder';
import { buildWorkbookBase64, suggestedFilename } from './excelExport';

const profile = makeNutritionProfile();
const energy = calculateEnergyTargets(profile);

let counter = 0;
const makeId = () => `id-${(counter += 1)}`;

async function buildExport() {
  counter = 0;
  const { plan } = await buildMealPlan({
    provider: localMealProvider,
    profile,
    preferences: seedFoodPreferences,
    targets: energy.macros,
    weekStarting: '2026-03-02',
    energyCalculationId: 'calc-1',
    trainingDays: [1, 2, 4, 5],
    splitTrainingDays: false,
    makeId,
  });

  const base64 = buildWorkbookBase64({
    plan: plan!,
    energy,
    profile,
    shoppingList: buildShoppingList(plan!),
    mealPrep: buildMealPrep(plan!, 5),
    displayName: 'Danny Bell',
    disclaimerText:
      'The Kennel nutrition features are for general fitness and educational purposes only and are not medical advice.',
  });

  // cellStyles is needed for column widths to survive the round trip.
  return {
    plan: plan!,
    base64,
    workbook: XLSX.read(base64, { type: 'base64', cellStyles: true }),
  };
}

describe('buildWorkbookBase64', () => {
  it('produces a genuine xlsx, not a renamed CSV', async () => {
    const { base64 } = await buildExport();
    const buffer = Buffer.from(base64, 'base64');

    // xlsx is a ZIP container: "PK\x03\x04".
    expect(buffer.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    expect(buffer.length).toBeGreaterThan(5000);
  });

  it('contains the eight sheets the spec asks for', async () => {
    const { workbook } = await buildExport();

    expect(workbook.SheetNames).toEqual([
      'Targets & Profile',
      'Weekly Plan',
      'Daily Macros',
      'Meal Options',
      'Recipes',
      'Shopping List',
      'Meal Prep',
      'My Foods',
    ]);
  });

  it('writes a row per meal across the week', async () => {
    const { workbook, plan } = await buildExport();
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets['Weekly Plan']!,
    );

    const expectedMeals = plan.days.reduce((sum, day) => sum + day.meals.length, 0);
    expect(rows).toHaveLength(expectedMeals);
    expect(rows[0]).toHaveProperty('Day');
    expect(rows[0]).toHaveProperty('kcal');
  });

  it('records plan against target on the macros sheet', async () => {
    const { workbook } = await buildExport();
    const rows = XLSX.utils.sheet_to_json<Record<string, number>>(
      workbook.Sheets['Daily Macros']!,
    );

    expect(rows).toHaveLength(7);
    for (const row of rows) {
      expect(typeof row['Target kcal']).toBe('number');
      expect(typeof row['Plan kcal']).toBe('number');
      // The difference column must actually be the difference.
      expect(row['Difference']).toBe(row['Plan kcal']! - row['Target kcal']!);
    }
  });

  it('carries the disclaimer and the versions into the exported file', async () => {
    const { workbook } = await buildExport();
    // The disclaimer is wrapped across cells for readability, so compare against
    // the text with line breaks collapsed rather than a single cell's contents.
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets['Targets & Profile']!);
    const flattened = csv.replace(/[\n,]+/g, ' ').replace(/\s+/g, ' ');

    expect(flattened).toContain('are not medical advice');
    expect(csv).toContain('Equation version');
    expect(csv).toContain('Safety policy version');
    expect(csv).toContain('RABID: THE KENNEL');
  });

  it('lists every shopping item with its state', async () => {
    const { workbook, plan } = await buildExport();
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(
      workbook.Sheets['Shopping List']!,
    );

    expect(rows.length).toBe(buildShoppingList(plan).items.length);
    expect(rows[0]).toHaveProperty('Aisle');
    expect(rows[0]).toHaveProperty('Quantity');
  });

  it('sets column widths rather than leaving a raw dump', async () => {
    const { workbook } = await buildExport();
    for (const name of workbook.SheetNames) {
      expect(workbook.Sheets[name]!['!cols']).toBeDefined();
    }
  });

  it('names the file after the plan week', async () => {
    const { plan } = await buildExport();
    expect(suggestedFilename(plan)).toBe('rabid-kennel-plan-2026-03-02.xlsx');
  });
});
