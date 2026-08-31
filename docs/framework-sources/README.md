# Framework sources

The source documents this engine was built from. They are kept in the repository so a framework record can be traced back to what it came from, and so a future change can be checked against the source rather than against somebody's memory of it.

| File | Used for |
|---|---|
| `master-spec.md` | Product, architecture and build specification. Everything else hangs off this. |
| `writing-rules.md` | The hard constraints. Encoded in `src/writing-rules/`. Overrides framework conventions where they conflict. |
| `nexus-hook-library.md` | The seven hook types, their formulas and 42 examples. Encoded in `src/frameworks/nexus-hooks.ts`. |
| `hormozi-framework-library.md` | Commercial and offer mechanisms. Encoded in `src/frameworks/hormozi.ts`. |
| `linkedin-distribution-logic.md` | **Authoritative** for LinkedIn distribution behaviour as of 31 August 2026. Encoded in `src/frameworks/linkedin-distribution.ts`. Re-verify against primary sources before changing hardwired logic. |

## Not included

**The Content Formula / C2C workbook** was supplied as an HTML workbook. Its frameworks are encoded in `src/frameworks/c2c.ts` with source attribution; the original file is not committed here because it is a large interactive document rather than reference text.

**The Lara Acosta SLAY framework** was supplied as an image. Its four stages are encoded in `src/frameworks/lara-slay.ts`. The image is not in the repository, so the source summary in that file is the record of what it established.

## Attribution

Every framework record in `src/frameworks/` carries `source`, `sourceSummary` (what the source establishes) and `appAdaptation` (how this system uses it) as separate fields. That separation is deliberate: without it, the engine gradually starts presenting its own adaptations as somebody else's source material.

Two frameworks share the SLAY acronym and are not the same framework. See `src/frameworks/lara-slay.ts` and `src/frameworks/psych-slay-variant.ts`, and the attribution tests in `tests/frameworks.test.ts`.
