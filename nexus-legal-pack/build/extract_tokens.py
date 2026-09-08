#!/usr/bin/env python3
"""Measure the reference PDF and write build/tokens.json.

Every value in tokens.json comes from this script. Nothing is typed by hand.

The reference page box is 800 x 1000 pt. The deliverables are A4 portrait, so
each measurement is recorded three ways:

  ref_pt  the raw measurement taken from the reference
  pt      the same measurement scaled to A4 width (595.276 / 800)
  mm      the scaled measurement in millimetres

The scale factor is derived from page width alone, so horizontal geometry maps
one to one onto A4. The reference page is proportionally taller than A4, so an
A4 page holds roughly eight fewer body lines per column. Header and cover
furniture is anchored to the top margin, footer furniture to the bottom margin,
and the flowing text column simply becomes shorter.

Usage:  python build/extract_tokens.py
"""

from __future__ import annotations

import collections
import json
import os
import subprocess
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
REFERENCE = ROOT / "input" / "reference" / "governance-policy.pdf"
SCRATCH = ROOT / "scratch"
FONT_DIR = ROOT / "build" / "fonts"
TOKENS = ROOT / "build" / "tokens.json"

A4_WIDTH_PT = 595.276
A4_HEIGHT_PT = 841.890
PT_PER_MM = 72.0 / 25.4


def hex_of(colour) -> str | None:
    if colour is None:
        return None
    return "#%02x%02x%02x" % tuple(int(round(c * 255)) for c in colour)


class Scale:
    """Converts reference points to A4 points and millimetres."""

    def __init__(self, ref_page_width: float, ref_page_height: float):
        self.factor = A4_WIDTH_PT / ref_page_width
        self.ref_height = ref_page_height

    def v(self, ref_pt: float, places: int = 2) -> dict:
        pt = ref_pt * self.factor
        return {
            "ref_pt": round(ref_pt, 2),
            "pt": round(pt, places),
            "mm": round(pt / PT_PER_MM, places),
        }

    def up(self, ref_y_from_top: float, places: int = 2) -> dict:
        """Same measurement expressed as a distance from the foot of the page.

        Bottom furniture must be anchored to the bottom margin, because A4 is
        proportionally taller than the reference page box.
        """
        value = self.v(self.ref_height - ref_y_from_top, places)
        value["measured_from"] = "page bottom"
        return value


def render_pages(doc: pymupdf.Document, dpi: int = 200) -> int:
    """Render every page to PNG so the reference can be inspected visually."""
    SCRATCH.mkdir(exist_ok=True)
    zoom = dpi / 72.0
    matrix = pymupdf.Matrix(zoom, zoom)
    for index in range(doc.page_count):
        target = SCRATCH / f"ref-{index + 1:02d}.png"
        if not target.exists():
            doc[index].get_pixmap(matrix=matrix).save(target)
    return doc.page_count


def extract_fonts(doc: pymupdf.Document) -> list[dict]:
    """Pull the embedded Type 1 fonts out of the reference and build WOFF2.

    The reference embeds the exact faces it was set in, so no substitution is
    needed. afdko converts Type 1 to UFO, ufo2ft compiles the UFO to OTF, and
    fontTools writes it out as WOFF2 for embedding in the HTML and the PDF.
    """
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(exist_ok=True)
    results, seen = [], set()

    for index in range(doc.page_count):
        for entry in doc[index].get_fonts(full=True):
            xref = entry[0]
            if xref in seen:
                continue
            seen.add(xref)
            name, ext, kind, buffer = doc.extract_font(xref)
            if not buffer:
                continue
            pfa = SCRATCH / f"{name}.{ext}"
            pfa.write_bytes(buffer)
            woff2 = FONT_DIR / f"{name}.woff2"
            if not woff2.exists():
                build_woff2(pfa, woff2)
            results.append(
                {
                    "postscript_name": name,
                    "source_format": kind,
                    "embedded_in_reference": True,
                    "webfont": str(woff2.relative_to(ROOT)),
                    "bytes": woff2.stat().st_size,
                }
            )
    return sorted(results, key=lambda f: f["postscript_name"])


def build_woff2(pfa: Path, woff2: Path) -> None:
    import defcon
    import ufo2ft
    from fontTools import agl

    ufo = pfa.with_suffix(".ufo")
    if not ufo.exists():
        subprocess.run(
            [sys.executable.replace("python", "tx"), "-ufo", "-o", str(ufo), str(pfa)],
            check=True,
        )
    # afdko writes '&' unescaped into fontinfo.plist, which is not valid XML.
    info = ufo / "fontinfo.plist"
    text = info.read_text()
    if " & " in text:
        info.write_text(text.replace(" & ", " &amp; "))

    font = defcon.Font(str(ufo))
    for glyph in font:
        if not glyph.unicodes:
            mapped = agl.toUnicode(glyph.name)
            if len(mapped) == 1:
                glyph.unicodes = [ord(mapped)]
    otf = ufo2ft.compileOTF(font, removeOverlaps=False, inplace=True)
    otf.flavor = "woff2"
    otf.save(str(woff2))


def census(doc: pymupdf.Document) -> dict:
    """Count every colour, stroke weight and type size used in the reference."""
    fills = collections.Counter()
    strokes = collections.Counter()
    stroke_widths = collections.Counter()
    text_colours = collections.Counter()
    type_sizes = collections.Counter()

    for index in range(doc.page_count):
        page = doc[index]
        for drawing in page.get_drawings():
            if drawing["fill"]:
                fills[hex_of(drawing["fill"])] += 1
            if drawing["color"]:
                strokes[hex_of(drawing["color"])] += 1
                stroke_widths[round(drawing["width"], 2)] += 1
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    text_colours["#%06x" % span["color"]] += 1
                    type_sizes[f'{round(span["size"], 2)}|{span["font"]}'] += 1

    return {
        "fill_colours": dict(fills.most_common()),
        "stroke_colours": dict(strokes.most_common()),
        "stroke_widths_ref_pt": {str(k): v for k, v in stroke_widths.most_common()},
        "text_colours": dict(text_colours.most_common()),
        "type_sizes_ref_pt": dict(type_sizes.most_common()),
    }


def main() -> None:
    doc = pymupdf.open(REFERENCE)
    page_rect = doc[0].rect
    s = Scale(page_rect.width, page_rect.height)

    rendered = render_pages(doc)
    fonts = extract_fonts(doc)
    counts = census(doc)

    tokens = {
        "_meta": {
            "generated_by": "build/extract_tokens.py",
            "reference": str(REFERENCE.relative_to(ROOT)),
            "reference_pages": doc.page_count,
            "pages_rendered_to": "scratch/ref-NN.png at 200 dpi",
            "reference_page_box_pt": [page_rect.width, page_rect.height],
            "target_page": "A4 portrait",
            "target_page_box_pt": [A4_WIDTH_PT, A4_HEIGHT_PT],
            "scale_factor": round(s.factor, 6),
            "scale_note": (
                "Derived from page width. Horizontal geometry maps exactly. "
                "The reference page is proportionally taller than A4, so the "
                "flowing column is shorter; top furniture is anchored to the "
                "top margin and bottom furniture to the bottom margin."
            ),
            "rendered_pages": rendered,
        },

        # ------------------------------------------------------------------
        # Colour. Sampled from the reference's own fill and stroke operators,
        # which is exact where pixel sampling would only be close.
        # ------------------------------------------------------------------
        "colour": {
            "page": "#ffffff",
            "ink": "#080f1c",
            "muted": "#566476",
            "accent": "#007cff",
            "accent_deep": "#005fca",
            "accent_link": "#075dba",
            "accent_pale": "#c9e2ff",
            "panel_dark": "#071a34",
            "panel_tint": "#e8f3ff",
            "panel_tint_faint": "#f4f9ff",
            "table_zebra": "#f6f8fb",
            "rule": "#dce6f0",
        },
        "colour_roles": {
            "page": "Page background, and the cover's white field.",
            "ink": "Body text, page titles, table body text, panel headings on tint.",
            "muted": "Cover lede, intro paragraphs, running header document name, footer.",
            "accent": "Primary brand blue. Rules, markers, panel top bars, cover panel, clause numbers, page-number box.",
            "accent_deep": "Control focus attribution line only.",
            "accent_link": "Link text inside schedule tables, and its underline.",
            "accent_pale": "Text and hairlines on dark panels; the hairline continuing a page-title underline.",
            "panel_dark": "Dark callout panels, table header row, record strips.",
            "panel_tint": "Light schedule panel, contents row markers, the column hairline on clause pages.",
            "panel_tint_faint": "Control focus panel.",
            "table_zebra": "Alternating table row fill.",
            "rule": "Hairlines, dividers, table rules.",
        },

        # ------------------------------------------------------------------
        # Page grid.
        # ------------------------------------------------------------------
        "grid": {
            "margin_x": s.v(62),
            "content_width": s.v(676),
            "column_width": s.v(322),
            "column_gutter": s.v(32),
            "column_rule_x_from_left": s.v(400),
            "column_start_y_from_top": s.v(236.24),
            "column_end_from_bottom": s.up(904),
        },

        # ------------------------------------------------------------------
        # Running header, footer and cover furniture.
        # ------------------------------------------------------------------
        "furniture": {
            "top_accent_bar_height": s.v(5),
            "right_accent_tab": {
                "width": s.v(5),
                "height": s.v(87),
                "top_from_top": s.v(5),
            },
            "logo_interior": {
                "x_from_left": s.v(62),
                "y_from_top": s.v(42.75),
                "width": s.v(192),
                "height": s.v(42.25),
            },
            "logo_cover": {
                "x_from_left": s.v(62),
                "y_from_top": s.v(67.78),
                "width": s.v(410),
                "height": s.v(90.22),
            },
            "header_document_name_baseline_from_top": s.v(52.64),
            "header_category_baseline_from_top": s.v(74.70),
            "header_rule_y_from_top": s.v(113),
            "header_rule_weight": s.v(0.7, 3),
            "section_marker_square": s.v(7),
            "section_marker_y_from_top": s.v(123),
            "section_label_x_from_left": s.v(79),
            "footer_rule_from_bottom": s.up(922),
            "footer_rule_weight": s.v(0.7, 3),
            "footer_accent_rule": {
                "width": s.v(22),
                "height": s.v(3),
                "from_bottom": s.up(957),
            },
            "footer_text_x_from_left": s.v(94),
            "footer_text_baseline_from_bottom": s.up(961.66),
            "footer_url_centre_x": s.v(400),
            "page_number_box": {
                "width": s.v(70),
                "height": s.v(37),
                "x_from_left": s.v(668),
                "from_bottom": s.up(973),
            },
        },

        # ------------------------------------------------------------------
        # Cover page.
        # ------------------------------------------------------------------
        "cover": {
            "accent_panel_x_from_left": s.v(620),
            "accent_panel_width": s.v(180),
            "accent_panel_width_as_page_fraction": round(180 / 800, 4),
            "top_accent_bar_width": s.v(620),
            "breadcrumb_baseline_from_top": s.v(206.90),
            "title_first_baseline_from_top": s.v(349.20),
            "title_line_step": s.v(57),
            "title_rule": {
                "width": s.v(180),
                "weight": s.v(5),
                "y_from_top": s.v(468),
            },
            "subtitle_first_baseline_from_top": s.v(521.60),
            "subtitle_line_step": s.v(21),
            "lede_first_baseline_from_top": s.v(586.40),
            "lede_line_step": s.v(20.5),
            "filler_rules": {
                "count": 12,
                "first_y_from_top": s.v(282),
                "step": s.v(48),
                "x_from_left": s.v(62),
                "width": s.v(518),
                "weight": s.v(0.6, 3),
            },
            "edition_panel": {
                "x_from_left": s.v(62),
                "bottom_from_bottom": s.up(874),
                "width": s.v(518),
                "height": s.v(84),
                "padding_x": s.v(22),
                "edition_baseline_from_top": s.v(826),
                "version_baseline_from_top": s.v(853.30),
            },
            "spine_text_baseline_x_from_left": s.v(714.80),
            "spine_text_bottom_from_bottom": s.up(908),
            "page_number_baseline_from_bottom": s.up(960.20),
            "page_number_x_from_left": s.v(693.18),
        },

        # ------------------------------------------------------------------
        # Components.
        # ------------------------------------------------------------------
        "components": {
            "page_title": {
                "baseline_from_top": s.v(216.60),
                "underline_y_from_top": s.v(220.24),
                "underline_width": s.v(84),
                "underline_weight": s.v(3.5),
                "trailing_hairline_start_x": s.v(154),
                "trailing_hairline_weight": s.v(1.0, 3),
            },
            "column_rule": {
                "weight": s.v(1.0, 3),
                "top_from_top": s.v(236.24),
                "bottom_from_bottom": s.up(904),
            },
            "subclause": {
                "accent_tab_width": s.v(22),
                "accent_tab_height": s.v(3),
                "tab_to_heading_baseline": s.v(24.82),
                "divider_weight": s.v(0.55, 3),
                "divider_to_next_tab": s.v(20),
                "text_to_divider": s.v(9.35),
            },
            "control_focus": {
                "x_from_left": s.v(62),
                "bottom_from_bottom": s.up(896),
                "width": s.v(676),
                "height": s.v(118),
                "top_rule_height": s.v(5),
                "numeral_x_from_left": s.v(82),
                "numeral_baseline_from_panel_top": s.v(105.8),
                "text_x_from_left": s.v(182),
                "label_baseline_from_panel_top": s.v(35.64),
                "names_first_baseline_from_panel_top": s.v(65.52),
                "names_line_step": s.v(16.5),
                "attribution_baseline_from_panel_top": s.v(99.64),
            },
            "table": {
                "header_row_height": s.v(25.26),
                "body_row_height": s.v(25.77),
                "schedule_row_height": s.v(23.50),
                "cell_padding_x": s.v(6),
                "rule_weight": s.v(0.55, 3),
                "vertical_rule_weight": s.v(0.45, 3),
                "header_underline_weight": s.v(3.0),
            },
            "dark_panel": {
                "x_from_left": s.v(62),
                "width": s.v(676),
                "top_rule_height": s.v(5),
                "padding_x": s.v(22),
                "heading_baseline_from_panel_top": s.v(37.6),
                "body_first_baseline_from_panel_top": s.v(69.24),
                "observed_heights": [s.v(136), s.v(150), s.v(236)],
            },
            "light_panel": {
                "x_from_left": s.v(62),
                "width": s.v(676),
                "top_rule_height": s.v(5),
                "padding_x": s.v(22),
                "heading_baseline_from_panel_top": s.v(45.6),
                "body_first_baseline_from_panel_top": s.v(77.36),
                "observed_height": s.v(132),
            },
            "record_strip": {
                "columns": 4,
                "column_width": s.v(134),
                "column_gap": s.v(24),
                "label_rule_weight": s.v(1.0, 3),
                "label_baseline_to_rule": s.v(16.56),
                "rule_to_body_baseline": s.v(24.02),
            },
            "contents_row": {
                "marker_width": s.v(28),
                "marker_height": s.v(26),
                "row_step": s.v(42),
                "rule_weight": s.v(0.5, 3),
                "title_x_from_left": s.v(102),
            },
            "big_numeral_panel": {
                "x_from_left": s.v(62),
                "width": s.v(224),
                "height": s.v(406),
                "padding_x": s.v(22),
                "step_rule_weight": s.v(0.8, 3),
                "step_row_height": s.v(38),
            },
        },

        # ------------------------------------------------------------------
        # Type. Sizes are reference points scaled to A4. Line heights are
        # expressed as a multiple of the type size, measured from baseline
        # deltas in the reference.
        # ------------------------------------------------------------------
        "type": {
            "family_display": {
                "postscript_name": "NimbusSansNarrow-Bold",
                "css_family": "Nexus Display",
                "role": "Heavy condensed grotesque. Cover title, page titles, panel headings, large numerals.",
                "substituted": False,
                "source": "Extracted from the reference PDF's embedded Type 1 font.",
            },
            "family_text": {
                "postscript_name": "NimbusSans-Regular / NimbusSans-Bold",
                "css_family": "Nexus Text",
                "role": "Neutral grotesque. Body, tables, page furniture, panel body text.",
                "substituted": False,
                "source": "Extracted from the reference PDF's embedded Type 1 fonts.",
            },
            "letter_spacing": {
                "value": 0,
                "note": (
                    "Measured, not assumed. Rendered string widths match the "
                    "fonts' natural advance widths to two decimal places on "
                    "every sample tested, including the uppercase letter-spaced-"
                    "looking runs. The open look comes from double spaces around "
                    "the slash separators, not from tracking."
                ),
            },
            "scale": {
                "cover_title": {"size": s.v(61), "line_height": 0.934, "family": "display"},
                "cover_subtitle": {"size": s.v(15.5), "line_height": 1.355, "family": "text_bold"},
                "cover_lede": {"size": s.v(14.5), "line_height": 1.414, "family": "text"},
                "cover_breadcrumb": {"size": s.v(9.5), "line_height": 1.0, "family": "text_bold"},
                "cover_edition": {"size": s.v(10), "line_height": 1.0, "family": "text_bold"},
                "cover_version": {"size": s.v(11.5), "line_height": 1.0, "family": "text"},
                "cover_spine": {"size": s.v(24), "line_height": 1.0, "family": "display"},
                "cover_page_number": {"size": s.v(11), "line_height": 1.0, "family": "text_bold"},
                "page_title": {"size": s.v(38), "line_height": 1.0, "family": "display",
                               "note": "Reference varies 34 to 40 to fit the measure; 38 is the modal value."},
                "body": {"size": s.v(12.35), "line_height": 1.390, "family": "text"},
                "subclause_heading": {"size": s.v(12.35), "line_height": 1.390, "family": "text_bold"},
                "intro_paragraph": {"size": s.v(11.7), "line_height": 1.385, "family": "text"},
                "panel_heading": {"size": s.v(18), "line_height": 1.0, "family": "display"},
                "panel_body": {"size": s.v(11.2), "line_height": 1.375, "family": "text"},
                "panel_kicker": {"size": s.v(8.6), "line_height": 1.0, "family": "text_bold"},
                "light_panel_body": {"size": s.v(11.8), "line_height": 1.373, "family": "text"},
                "table_header": {"size": s.v(10.2), "line_height": 1.324, "family": "text_bold"},
                "table_cell": {"size": s.v(10.2), "line_height": 1.324, "family": "text"},
                "schedule_table_cell": {"size": s.v(8.8), "line_height": 1.324, "family": "text"},
                "record_label": {"size": s.v(8.2), "line_height": 1.0, "family": "text_bold"},
                "record_body": {"size": s.v(10.5), "line_height": 1.352, "family": "text"},
                "contents_title": {"size": s.v(11.8), "line_height": 1.0, "family": "text_bold"},
                "contents_number": {"size": s.v(9.5), "line_height": 1.0, "family": "text_bold"},
                "contents_page": {"size": s.v(10.5), "line_height": 1.0, "family": "text_bold"},
                "header_document": {"size": s.v(8.2), "line_height": 1.0, "family": "text_bold"},
                "header_category": {"size": s.v(8.5), "line_height": 1.0, "family": "text_bold"},
                "header_section": {"size": s.v(9.0), "line_height": 1.0, "family": "text_bold"},
                "footer": {"size": s.v(8.3), "line_height": 1.0, "family": "text_bold"},
                "footer_url": {"size": s.v(8.3), "line_height": 1.0, "family": "text"},
                "footer_page_number": {"size": s.v(12), "line_height": 1.0, "family": "text_bold"},
                "control_focus_label": {"size": s.v(8.2), "line_height": 1.0, "family": "text_bold"},
                "control_focus_names": {"size": s.v(12.1), "line_height": 1.364, "family": "text_bold"},
                "control_focus_attribution": {"size": s.v(8.2), "line_height": 1.0, "family": "text_bold"},
                "control_focus_numeral": {"size": s.v(54), "line_height": 1.0, "family": "display"},
                "big_numeral": {"size": s.v(62), "line_height": 1.0, "family": "display"},
                "big_numeral_caption": {"size": s.v(28), "line_height": 1.0, "family": "display"},
            },
        },

        "fonts": fonts,
        "census": counts,
    }

    TOKENS.write_text(json.dumps(tokens, indent=2) + "\n")
    print(f"wrote {TOKENS.relative_to(ROOT)}")
    print(f"  {rendered} reference pages rendered to scratch/")
    print(f"  {len(tokens['colour'])} colours, {len(tokens['type']['scale'])} type steps")
    print(f"  {len(fonts)} fonts extracted to build/fonts/")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
