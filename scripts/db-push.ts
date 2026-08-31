/**
 * Apply the database schema to Supabase.
 *
 * Uses psql when it is available. When it is not, it prints the migration path
 * and what to do with it rather than pretending to have run.
 *
 * Usage: npm run db:push
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION = resolve("supabase/migrations/0001_init.sql");

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!existsSync(MIGRATION)) fail(`Migration not found at ${MIGRATION}`);

const url = process.env.DATABASE_URL;
if (!url) {
  fail(
    "DATABASE_URL is not set.\n\n" +
      "Find it in Supabase under Project Settings, Database, Connection string, URI. " +
      "Use the connection pooler string and put your database password into it.",
  );
}

const hasPsql = spawnSync("psql", ["--version"], { stdio: "ignore" }).status === 0;

if (!hasPsql) {
  const sql = readFileSync(MIGRATION, "utf8");
  console.log(
    [
      "psql is not installed in this environment, so the schema was not applied.",
      "",
      "Apply it by hand instead:",
      "  1. Open your Supabase project.",
      "  2. Go to the SQL Editor and start a new query.",
      `  3. Paste the contents of ${MIGRATION} and run it.`,
      "",
      `The file is ${sql.split("\n").length} lines. It is idempotent for tables`,
      "(create table if not exists) but not for types and policies, so run it once",
      "on a fresh project.",
    ].join("\n"),
  );
  process.exit(0);
}

console.log("Applying supabase/migrations/0001_init.sql ...");

const result = spawnSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-f", MIGRATION], {
  stdio: "inherit",
});

if (result.status !== 0) {
  fail(
    "The migration did not apply cleanly.\n\n" +
      "If it failed on 'type post_status already exists' or a duplicate policy, the\n" +
      "schema is already there and there is nothing to do.",
  );
}

console.log("\nSchema applied. Next: npm run seed:frameworks");
