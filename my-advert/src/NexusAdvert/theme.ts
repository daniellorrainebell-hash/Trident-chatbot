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
  chrome: "#E9EDF3",
  steel: "#8A93A3",
  flat: "#5B6270",
};

export const contact = {
  phone: "0800 193 5055",
  email: "Daniel@nexus-iq.co.uk",
  web: "www.nexus-iq.co.uk",
};
