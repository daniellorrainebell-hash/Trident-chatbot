/**
 * Lint a LinkedIn post from a file or stdin against the Nexus IQ writing rules.
 *
 * Usage:
 *   npm run lint:post -- path/to/draft.txt
 *   cat draft.txt | npm run lint:post
 *
 * Exits 1 when errors are present, so it can gate a pipeline.
 */

import { readFileSync } from "node:fs";
import { lintPost } from "../src/writing-rules/linter";

function readInput(): string {
  const path = process.argv[2];
  if (path) return readFileSync(path, "utf8");
  return readFileSync(0, "utf8");
}

const text = readInput().trim();

if (!text) {
  console.error("No input. Pass a file path or pipe text on stdin.");
  process.exit(2);
}

const result = lintPost(text);

if (result.findings.length === 0) {
  console.log("Clean. No writing rule violations found.");
  process.exit(0);
}

for (const finding of result.findings) {
  const label = finding.severity === "error" ? "ERROR  " : "warning";
  console.log(
    `${label} ${finding.ruleId} (section ${finding.ruleRef})\n` +
      `        "${finding.excerpt}"\n` +
      `        ${finding.message}` +
      (finding.suggestion ? `\n        Fix: ${finding.suggestion}` : ""),
  );
}

console.log(
  `\n${result.errors.length} error(s), ${result.warnings.length} warning(s).`,
);

process.exit(result.errors.length > 0 ? 1 : 0);
