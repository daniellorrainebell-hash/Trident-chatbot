import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled locally (variable woff2 files) so renders never depend
// on reaching Google Fonts.
export const serif = "Fraunces";
export const sans = "DM Sans";

loadFont({ family: serif, url: staticFile("fonts/Fraunces.woff2"), weight: "100 900" });
loadFont({ family: serif, url: staticFile("fonts/Fraunces-Italic.woff2"), weight: "100 900", style: "italic" });
loadFont({ family: sans, url: staticFile("fonts/DMSans.woff2"), weight: "100 1000" });

// Nexus IQ brand: clean white + electric blue, deep navy text
export const colors = {
  bg: "#F4F8FF",
  white: "#FFFFFF",
  ink: "#0A1A3F",
  inkSoft: "#3D5078",
  navy: "#0A1A3F",
  blue: "#0A66FF",
  blueDeep: "#0047D6",
  blueLight: "#E6F0FF",
};

export const FPS = 30;
