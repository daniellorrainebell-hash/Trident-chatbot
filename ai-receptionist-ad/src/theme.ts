import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled locally (variable woff2 files) so renders never depend
// on reaching Google Fonts.
export const serif = "Fraunces";
export const sans = "DM Sans";

loadFont({ family: serif, url: staticFile("fonts/Fraunces.woff2"), weight: "100 900" });
loadFont({ family: serif, url: staticFile("fonts/Fraunces-Italic.woff2"), weight: "100 900", style: "italic" });
loadFont({ family: sans, url: staticFile("fonts/DMSans.woff2"), weight: "100 1000" });

// Warm clay palette + Nexus IQ blue
export const colors = {
  cream: "#F4EBDD",
  creamLight: "#FBF6EE",
  sand: "#E8D9C3",
  ink: "#2E2520",
  inkSoft: "#6B5A4E",
  terracotta: "#C8734F",
  blue: "#1F6FE5",
  blueDeep: "#0F4FB8",
};

export const FPS = 30;
