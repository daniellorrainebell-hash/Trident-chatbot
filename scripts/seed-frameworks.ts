/**
 * Seed the framework_definitions table from the code definitions.
 *
 * Code is the default; the table is the editable copy. Re-running this upserts,
 * so a framework edited in the database is overwritten only when its code
 * definition changes and this script is run again deliberately.
 *
 * Usage: npm run seed:frameworks
 */

import { ALL_FRAMEWORKS } from "../src/frameworks/registry";
import { getServiceClient } from "../src/lib/supabase";
import { isHookFamily } from "../src/frameworks/types";

async function main(): Promise<void> {
  const supabase = getServiceClient();

  const rows = ALL_FRAMEWORKS.map((framework) => ({
    id: framework.id,
    name: framework.name,
    source: framework.source,
    source_family: framework.sourceFamily ?? null,
    category: framework.category,
    description: framework.sourceSummary,
    rules_json: {
      app_adaptation: framework.appAdaptation,
      structure: framework.structure ?? [],
      best_for: framework.bestFor,
      allowed_use: framework.allowedUse,
      misuse_risks: framework.misuseRisks,
      rules: framework.rules ?? [],
      ...(isHookFamily(framework)
        ? { formula: framework.formula, purpose: framework.purpose, mechanism: framework.mechanism }
        : {}),
    },
    examples_json: isHookFamily(framework) ? framework.examples : [],
    active: framework.active,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("framework_definitions")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} framework definitions.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
