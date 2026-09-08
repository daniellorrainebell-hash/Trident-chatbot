# CLAUDE.md

Project brief for Claude Code. Read this file fully before doing anything.

---

## What this project is

Build a set of branded PDF and HTML legal documents for Nexus Academy that are visually indistinguishable from the existing Nexus IQ AI Governance Master Policy, which is supplied in `input/reference/`.

You are reproducing an existing house style, not designing a new one. Every visual decision should be traceable to the reference PDF.

---

## Folder structure

Create this structure if it doesn't exist:

```
nexus-legal-pack/
├── CLAUDE.md                    <- this file
├── input/
│   ├── reference/
│   │   └── governance-policy.pdf    <- the style reference I supply
│   ├── brand/
│   │   └── logo.png                 <- the logo I supply
│   └── content/
│       └── legal-pack.md            <- the document text I supply
├── build/
│   ├── tokens.json              <- you extract this
│   ├── styles.css               <- you write this
│   ├── templates/
│   │   ├── cover.html
│   │   ├── clause-page.html
│   │   ├── table-page.html
│   │   └── schedule-page.html
│   └── build.py                 <- you write this
├── output/
│   ├── pdf/
│   └── html/
└── notes/
    └── style-audit.md           <- you write this
```

---

## Phase 1: Extract the style. Do this before writing any CSS.

Do not guess at colours or spacing. Measure them.

1. Render every page of `input/reference/governance-policy.pdf` to PNG at 200 DPI into a scratch folder.
2. Inspect the rendered pages visually.
3. Sample actual pixel values for every colour in use. At minimum you need: page background, body text, heading text, primary accent, dark panel background, dark panel text, light tinted panel background, table header background, table alternating row fill, rule and divider colour.
4. Measure, in millimetres relative to the page size: page margins, column widths, the gutter between columns, the width of the cover's right-edge accent panel, the height and position of the header and footer zones.
5. Identify the typefaces. Extract embedded font names from the PDF metadata. If the exact fonts aren't available to you, choose the closest freely available substitutes and record the substitution in the audit. The title face is a heavy condensed grotesque. The body face is a neutral humanist sans.
6. Measure the type scale: cover title, section heading, sub-clause heading, body, caption, page furniture. Record sizes and line heights.

Write everything you find to `build/tokens.json` and write a plain-English summary to `notes/style-audit.md`, including any substitution you had to make and anything you couldn't determine confidently.

**Show me the audit and wait for my approval before moving to Phase 2.**

---

## Phase 2: The components you must reproduce

From the reference, these are the components. Build each as a reusable template partial.

**Cover page**
- Full-height accent-colour panel down the right edge, roughly one fifth of the page width
- Vertical rotated text running up that panel
- Logo top left in the white area
- Breadcrumb line beneath it: series name / section / number, uppercase, small, letter-spaced, accent colour on the separators
- Large condensed uppercase title, multiple lines, tight leading
- A short heavy accent rule beneath the title
- Subtitle in bold uppercase
- A muted descriptive paragraph
- A set of thin horizontal rules occupying the empty middle
- A dark panel near the base holding the edition line and the version and date
- Page number bottom right inside the accent panel

**Running header** (every interior page)
- Thin accent rule across the very top of the page
- Logo top left
- Two right-aligned lines: document name, then category in accent colour
- Below, a small filled square marker plus the section label in accent colour, uppercase and letter-spaced
- A hairline rule under that

**Running footer** (every interior page)
- Short accent rule, then organisation name and series in bold uppercase
- URL centred, muted
- Page number in a solid accent box, bottom right, in the form `NN / TT`

**Clause page**
- Large bold heading with a heavy accent underline that stops short of the full width
- Two columns with a vertical hairline between them
- Sub-clauses numbered `N.N` with the number in accent colour and the heading in bold, body text beneath
- A short accent rule above each sub-clause
- Thin dividers between sub-clauses

**Control focus panel** (base of clause pages)
- Light tinted panel, heavy accent rule along the top
- Very large accent numeral on the left
- `CONTROL FOCUS` label in small muted uppercase
- The clause names in bold uppercase separated by forward slashes
- A small attribution line beneath in accent colour

**Data table**
- Dark navy header row with white text
- Alternating row fill
- First column may carry an accent-coloured status word
- Full width, thin rules

**Dark callout panel**
- Solid dark navy background, heavy accent rule on top
- White bold heading, lighter body text
- Used for the warnings and the record blocks

**Light schedule panel**
- Pale tinted background, heavy accent top rule
- Bold heading, body text
- Used for the schedules

**Four-column record strip**
- Dark panel containing four labelled columns, label in accent uppercase above muted body text

---

## Phase 3: Build

**Approach.** Semantic HTML plus a single print stylesheet, rendered to PDF through a headless browser. Do not build PDFs imperatively with a drawing library. The HTML must also stand alone as a readable web document.

**Requirements**
- A4 portrait, `@page` rules for margins, CSS counters for page numbers
- All design values come from `build/tokens.json`. No hard-coded hex values anywhere in the CSS
- The logo is embedded as base64 so both outputs are single self-contained files
- `build/build.py` parses `input/content/legal-pack.md`, splits on the document headings, applies the right template per block type, and writes both outputs
- Content and presentation stay separate. I must be able to edit the markdown and rerun the build without touching CSS

**Content rules, non-negotiable**
- Reproduce the supplied text exactly. Do not rewrite, improve, summarise or extend it
- Every bracketed placeholder such as `[LEGAL ENTITY NAME]` must survive into the output, visibly, as a bracketed placeholder
- The two documents marked as requiring solicitor review must keep those warnings, rendered as dark callout panels
- If the markdown is ambiguous about which component to use, ask rather than guess

**Setup**

```bash
mkdir -p nexus-legal-pack/{input/{reference,brand,content},build/templates,output/{pdf,html},notes}
cd nexus-legal-pack
python3 -m venv .venv && source .venv/bin/activate
pip install playwright markdown jinja2 pymupdf pillow
playwright install chromium
```

`pymupdf` renders and inspects the reference. `pillow` samples the colours. `jinja2` templates. `playwright` prints to PDF.

**Build**

```bash
python build/build.py
```

---

## Phase 4: Verify

Do not tell me it's finished until all of these pass.

1. Render page 6 of the reference and page 6 of your output side by side at the same size. Compare header position, footer position, column widths, type sizes and rule weights. Iterate until they match.
2. Confirm every colour in the output appears in `tokens.json`.
3. Confirm every bracketed placeholder from the source markdown appears in the PDF. Count them and report the number.
4. Confirm page numbers run correctly and the total is right.
5. Confirm the HTML opens standalone with no missing assets and no external requests.
6. Confirm no text overflows a column, no heading is orphaned at the foot of a page, and no table splits mid-row.
7. Report the output file sizes.

Then show me the first three pages as images before I open anything.

---

## Ground rules

- Work in phases and stop at each checkpoint. Don't build the whole thing and present it finished
- Ask when something is ambiguous. A wrong assumption reproduced across 40 pages is expensive
- Don't add anything that isn't in the reference. No icons, no stock imagery, no gradients, no decorative flourishes. The reference is restrained and the output must be too
- Keep the generous margins and the empty space. Do not fill the page
- British English throughout
- Don't touch anything in `input/`. Those are my source files
- Commit after each phase with a clear message

---

## What I'll supply

- `input/reference/governance-policy.pdf` — the style reference
- `input/brand/logo.png` — the logo
- `input/content/legal-pack.md` — the document text

Everything else is yours to create.

---

## Deliverables

- `output/pdf/nexus-academy-course-legal-pack.pdf`
- `output/html/nexus-academy-course-legal-pack.html`
- `build/tokens.json`, reusable for future documents in this series
- `notes/style-audit.md`
- A short README explaining how to add document 03 to the series later
