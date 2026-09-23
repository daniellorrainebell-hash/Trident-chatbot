import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled in public/fonts so rendering never depends on the network.
// Anton: bold condensed display face for headlines. Inter: clean supporting copy.
export const display = "Anton";
export const body = "Inter";

loadFont({
  family: display,
  url: staticFile("fonts/Anton-Regular.woff2"),
  weight: "400",
});
loadFont({
  family: body,
  url: staticFile("fonts/Inter-Variable.woff2"),
  weight: "100 900",
});

// Palette sampled from the Nexus IQ chrome/electric-blue logo.
export const colors = {
  black: "#03050B",
  navy: "#07122B",
  blue: "#1E6BFF",
  electric: "#3D8BFF",
  ice: "#A9C8FF",
  chrome: "#E8ECF2",
  steel: "#8A93A3",
  flat: "#5B6270",
};

// Brushed-chrome fill for headline text (used with background-clip: text).
export const chromeGradient =
  "linear-gradient(180deg, #F4F7FB 0%, #C4CEDD 20%, #7D899E 40%, #2A3346 49%, #9FB0CA 53%, #E6EEF9 66%, #8FB0EA 82%, #3E6FE0 94%, #1B47BF 100%)";

// Electric-blue anodised metal for accent lines.
export const blueChromeGradient =
  "linear-gradient(180deg, #E4F0FF 0%, #8DB8FF 24%, #3772F0 44%, #0A2A85 50%, #3F82FF 58%, #A9CBFF 76%, #4C86FF 92%, #1C4FD0 100%)";

export const contact = {
  phone: "0800 193 5055",
  email: "Daniel@nexus-iq.co.uk",
  web: "www.nexus-iq.co.uk",
};
