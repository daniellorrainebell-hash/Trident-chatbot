# Style audit — Nexus IQ AI Governance Master Policy

Phase 1 output. Everything below was measured from `input/reference/governance-policy.pdf`, not estimated. The machine-readable form is `build/tokens.json`; this file is the plain-English summary.

Reproduce it with:

```bash
python build/extract_tokens.py
```

---

## How the measurements were taken

The reference is a vector PDF, so I did not have to sample pixels. All 37 pages were rendered to PNG at 200 dpi into `scratch/` and inspected visually, and then every rule, panel and block of text was read back out of the PDF's own drawing and text operators. That gives exact fill colours, exact stroke weights and exact coordinates rather than values recovered from a screenshot.

The one thing worth knowing before reading the numbers: **the reference is not A4.** Its page box is 800 × 1000 pt, which is roughly 282 × 353 mm. The brief asks for A4, so every measurement is recorded three ways in `tokens.json` — the raw reference value, the value scaled to A4, and the same in millimetres.

---

## The page, and what changes on A4

| | Reference | A4 output |
|---|---|---|
| Page box | 800 × 1000 pt | 595.28 × 841.89 pt |
| Aspect | 1 : 1.250 | 1 : 1.414 |
| Scale factor applied | — | 0.744095 |

The scale factor comes from page width alone, so **the horizontal grid maps onto A4 exactly** — same proportions, same relationship between margin, column and gutter.

A4 is proportionally taller and narrower, so the vertical fit needs a decision. I have taken the approach the reference itself implies: top furniture is anchored to the top margin, bottom furniture to the bottom margin, and the flowing text column between them simply gets shorter. The alternative, stretching the vertical spacing to fill A4, would break the relationship between type size and leading and would not look like the reference.

The practical effect is that an A4 clause page carries about eight fewer body lines per column than the reference does. That means slightly more pages for the same wordcount. It does not change how any single page looks.

## The grid

| Measurement | Reference | A4 |
|---|---|---|
| Left and right margin | 62 pt | 46.13 pt / 16.28 mm |
| Content width | 676 pt | 503.01 pt / 177.45 mm |
| Column width | 322 pt | 239.60 pt / 84.53 mm |
| Gutter between columns | 32 pt | 23.81 pt / 8.40 mm |
| Column hairline | on the page centreline | 105.00 mm from the left edge |
| Text column starts | 236.24 pt from the top | 62.01 mm from the top |
| Text column ends | 96 pt above the foot | 33.87 mm above the foot |

Two columns, equal width, with a 1 pt hairline in `#e8f3ff` running down the gutter centre. Every full-width component — tables, dark panels, the control focus panel — spans the whole 676 pt content width and ignores the columns.

## The cover

| Measurement | Reference | A4 |
|---|---|---|
| Accent panel width | 180 pt, 22.5% of page width | 133.94 pt / 47.25 mm |
| Panel starts at | 620 pt from the left | 461.34 pt / 162.75 mm |
| Top accent bar | 5 pt tall, stops at the panel | 3.72 pt / 1.31 mm |
| Logo | 410 × 90.22 pt | 305.08 × 67.13 pt / 107.63 × 23.68 mm |
| Title rule under the title | 180 pt wide, 5 pt heavy | 133.94 pt wide, 3.72 pt heavy |
| Filler rules in the empty middle | 12 rules, 518 pt wide, 48 pt apart, 0.6 pt | 385.44 pt wide, 35.72 pt apart |
| Dark edition panel | 518 × 84 pt | 385.44 × 62.50 pt |

The vertical text up the accent panel is set in the condensed face at 24 pt, rotated 90° anticlockwise, reading upward. The page number sits at the foot of the accent panel in white, not in a box — the boxed page number is an interior-page component only.

The filler rules are worth calling out because they are what stops the cover looking empty without adding anything decorative. They are on a strict 48 pt grid that starts at 282 pt and runs to 810 pt, and the title, subtitle and lede simply sit on top of them.

## Running header and footer

Header, on every interior page:

- A 5 pt accent bar across the full page width, bleeding to all three edges.
- A second accent tab, 5 × 87 pt, on the right edge directly below it.
- The logo at 192 × 42.25 pt, at the left margin, 42.75 pt down.
- Two right-aligned lines: the document name at 8.2 pt bold in muted grey, and the category at 8.5 pt bold in accent blue.
- A 0.7 pt hairline across the content width at 113 pt.
- A 7 pt filled accent square at the left margin, and the section label 17 pt to its right at 9 pt bold in accent blue.

Footer, on every interior page:

- A 0.7 pt hairline across the content width, 78 pt above the foot.
- A 22 × 3 pt accent rule at the left margin, then the organisation and series at 8.3 pt bold in muted grey.
- The URL centred on the page centreline, 8.3 pt regular, muted grey.
- The page number in a solid accent box, 70 × 37 pt, hard against the right margin, white 12 pt bold, in the form `NN / TT`.

## The palette

Twelve colours, and no others appear anywhere in 37 pages.

| Token | Value | Where it is used |
|---|---|---|
| `page` | `#ffffff` | Page background |
| `ink` | `#080f1c` | Body text, page titles, table body text |
| `muted` | `#566476` | Cover lede, intro paragraphs, header document name, footer |
| `accent` | `#007cff` | Rules, markers, panel top bars, cover panel, clause numbers, page-number box |
| `accent_deep` | `#005fca` | The control focus attribution line, and nothing else |
| `accent_link` | `#075dba` | Link text in schedule tables, and its underline |
| `accent_pale` | `#c9e2ff` | Text and hairlines on dark panels; the hairline continuing a page-title underline |
| `panel_dark` | `#071a34` | Dark callout panels, table header rows, record strips |
| `panel_tint` | `#e8f3ff` | Light schedule panel, contents row markers, the column hairline |
| `panel_tint_faint` | `#f4f9ff` | The control focus panel |
| `table_zebra` | `#f6f8fb` | Alternating table row fill |
| `rule` | `#dce6f0` | Hairlines, dividers, table rules |

Note that there are three blues doing three different jobs, and that the light tint used for the control focus panel (`#f4f9ff`) is deliberately fainter than the one used for schedule panels (`#e8f3ff`). Getting those two the wrong way round is the easiest mistake to make.

Stroke weights in use, in reference points: 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 1.0, 3.0, 3.5, 5.0. The heavy weights are structural — 5 pt tops a panel, 3.5 pt underlines a page title — and everything at or below 1 pt is a hairline.

## The typefaces

**No substitution was needed.** The reference embeds its fonts, so I extracted the actual faces rather than guessing at lookalikes:

| Role | Face | Notes |
|---|---|---|
| Display | Nimbus Sans Narrow Bold | The heavy condensed grotesque. Cover title, page titles, panel headings, large numerals. |
| Text | Nimbus Sans Regular and Bold | The neutral grotesque. Body, tables, page furniture, panel body. |

Nimbus Sans is URW's Helvetica, and Nimbus Sans Narrow is its condensed cut. They were embedded in the reference as Type 1, which no browser can use, so the build converts them to WOFF2 in `build/fonts/`. The three faces come to 113 KB and are embedded as base64 in both outputs, so the HTML is self-contained and makes no external requests.

I verified the conversion by measuring rendered string widths against the reference. Fourteen sample strings across seven type sizes match the reference's own text bounding boxes to two decimal places, so the converted fonts are metrically identical to the originals, not merely similar.

**There is no letter-spacing anywhere in the document.** The uppercase furniture looks tracked out, but it is not — the reference uses two spaces either side of every slash separator, which is what produces the open look. Adding tracking would be visibly wrong.

## The type scale

Sizes below are given as reference points, then the A4 equivalent. Line heights are measured from baseline-to-baseline deltas in the reference and expressed as a multiple of the type size.

| Step | Reference | A4 | Line height | Face |
|---|---|---|---|---|
| Cover title | 61 pt | 45.39 pt | 0.93 | Display |
| Cover subtitle | 15.5 pt | 11.53 pt | 1.36 | Text bold |
| Cover lede | 14.5 pt | 10.79 pt | 1.41 | Text |
| Cover breadcrumb | 9.5 pt | 7.07 pt | — | Text bold |
| Page title | 38 pt | 28.28 pt | — | Display |
| Body | 12.35 pt | 9.19 pt | 1.39 | Text |
| Sub-clause heading | 12.35 pt | 9.19 pt | 1.39 | Text bold |
| Intro paragraph | 11.7 pt | 8.71 pt | 1.39 | Text |
| Panel heading | 18 pt | 13.39 pt | — | Display |
| Panel body | 11.2 pt | 8.33 pt | 1.38 | Text |
| Table header and cell | 10.2 pt | 7.59 pt | 1.32 | Text bold / Text |
| Schedule table cell | 8.8 pt | 6.55 pt | 1.32 | Text |
| Header document name | 8.2 pt | 6.10 pt | — | Text bold |
| Header category | 8.5 pt | 6.33 pt | — | Text bold |
| Header section label | 9 pt | 6.70 pt | — | Text bold |
| Footer | 8.3 pt | 6.18 pt | — | Text bold / Text |
| Footer page number | 12 pt | 8.93 pt | — | Text bold |
| Control focus numeral | 54 pt | 40.18 pt | — | Display |
| Control focus names | 12.1 pt | 9.00 pt | 1.36 | Text bold |

## Components, as measured

**Page title.** Set in the condensed face, sentence case, at the left margin. Underlined by an 84 pt accent rule at 3.5 pt weight that deliberately stops well short of the measure, and then continued to the right margin by a 1 pt hairline in pale blue starting 8 pt further on. That break between the heavy stub and the hairline is a signature detail.

**Sub-clause.** A 22 × 3 pt accent tab, then 24.82 pt down to the heading baseline. The clause number is accent blue and the heading is bold ink, both on the same line at body size. Body text follows at the same size. A 0.55 pt divider closes the clause, 9.35 pt below the last line, and the next accent tab starts 20 pt below that.

**Control focus panel.** 676 × 118 pt in the faintest tint, with a 5 pt accent bar along the top. A 54 pt accent numeral at 82 pt from the left, then a text column at 182 pt carrying a small muted `CONTROL FOCUS` label, the clause names in bold uppercase separated by spaced forward slashes, and an attribution line in `#005fca`.

**Data table.** Full content width. A `#071a34` header row 25.26 pt tall with white 10.2 pt bold text, closed underneath by a 3 pt accent rule. Body rows are 25.77 pt, alternating white and `#f6f8fb`, separated by 0.55 pt rules, with 0.45 pt vertical rules between columns and 6 pt of cell padding. Where the first column carries a status word it is set in accent blue bold. Schedule tables use a tighter 23.50 pt row and 8.8 pt text.

**Dark callout panel.** Full content width, `#071a34`, 5 pt accent bar on top, 22 pt of horizontal padding. Heading in the condensed face at 18 pt white; body at 11.2 pt in white or pale blue. Observed heights are 136, 150 and 236 pt — the panel is sized to its content, not fixed.

**Light schedule panel.** The same geometry in `#e8f3ff`, with the heading in ink rather than white and the body at 11.8 pt.

**Four-column record strip.** A dark panel carrying four 134 pt columns, 24 pt apart. Each has an 8.2 pt accent uppercase label, a 1 pt accent rule under it, then body text at 10.5 pt in pale blue.

**Contents row.** A 28 × 26 pt tinted marker holding the clause number in accent blue, the title at 11.8 pt bold at 102 pt from the left, the page number right-aligned in accent blue, and a 0.5 pt rule under the row. Rows step every 42 pt in two columns.

---

## What I could not determine, and what I decided

1. **Page titles are not one fixed size.** They range from 34 to 40 pt across the reference, which tells me the original generator shrank the title to fit the measure on a single line. 38 pt is the modal value and is what I have recorded. I intend to set 38 pt as the standard and shrink only where a title would otherwise wrap, which reproduces the behaviour rather than the artefact.

2. **Body text is not one fixed size either.** It varies between 11.35 and 12.35 pt from page to page, again to fill the column. 12.35 pt is both the modal and the maximum value, and is what pages 6 and 33 use. I have taken it as the standard and will not vary it, because varying body size page to page is a drawing-library habit rather than a design decision, and it would be visible in a document that is read rather than glanced at.

3. **The logo you supplied is the same artwork as the reference's**, at higher resolution — 4096 × 900 against 1536 × 338, and the aspect ratios agree to three decimal places. I will downsample it to about 1280 px wide for embedding, which is comfortably above 300 dpi at the cover size, and leave `input/brand/logo.png` untouched.

4. **The dark callout panel's body colour is inconsistent in the reference.** The page 2 callout uses white body text; the page 3 and 36 record strips use pale blue. I read that as two different components rather than an inconsistency, and have tokenised them separately.

5. **I could not find a stated URL for Nexus Academy.** The reference footer reads `WWW.NEXUS-IQ.CO.UK`. See the question below.

---

## Questions before Phase 2

These change what goes on the page, so I would rather ask than guess.

1. **Footer URL.** Keep `WWW.NEXUS-IQ.CO.UK`, or use a Nexus Academy address?

2. **Cover edition panel.** The reference carries `UK-FIRST / EEA-AWARE / PUBLICATION EDITION` over `Version 2.1 / Legal currency date: 30 August 2026`. The source markdown gives no version and no date. My proposal is `DRAFT FOR SOLICITOR REVIEW / NOT LEGAL ADVICE` over `Version [VERSION] / Effective date: [DD MONTH YYYY]`, which keeps the component and keeps the unknowns visible as bracketed placeholders. Content that is not in your markdown, though, so I want it confirmed.

3. **Control focus attribution.** The reference reads `NEXUS IQ / GOVERNANCE STANDARD`. I propose `NEXUS ACADEMY / LEGAL + GOVERNANCE SERIES`.

4. **The `INSTRUCTION FOR CLAUDE DESIGN` section** at the end of the markdown is a brief to me, not part of the legal pack. I propose to leave it out of both outputs. Same question for the closing `**Next step:** send the draft to a solicitor…` line.

5. **Blockquote handling.** Two blockquotes are settled by the brief — the `SOLICITOR REVIEW REQUIRED` warnings on Documents 2 and 7 become dark callout panels. Four others are not, and I propose light schedule panels for all four: the "must be published at a stable public URL" note on Document 3, the "include only if you run a community" note on Document 6, the "choose ONE of the following" note in Document 2 § 3, and the ebook front matter block.

6. **Section categories.** The running header's second line is a category. I propose grouping the seven documents as `COMMERCIAL` (1, 2), `DATA PROTECTION` (3, 4), `LICENCE + CONDUCT` (5, 6) and `MARKETING CLAIMS` (7), with `FOUNDATION` for the front matter and `SCHEDULES` for the checkout requirements. Say the word if you would rather each document carried its own.
