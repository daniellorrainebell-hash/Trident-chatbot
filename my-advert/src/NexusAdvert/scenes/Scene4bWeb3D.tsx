import React from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { ChromeText } from "../components/ChromeText";
import { RevealLine } from "../components/RevealLine";
import { Sfx } from "../components/Sfx";
import { body, colors, display } from "../theme";

// Scene 4b — Interactive 3D for the web. Screen recording of the Nexus IQ
// particle-brain React/three.js component: "INTERACTIVE 3D WEB."
export const Scene4bWeb3D: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill name="Web 3D" style={{ backgroundColor: "#000000" }}>
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, 120], [1.02, 1.14]),
          translate: "0px 110px",
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Video
          src={staticFile("video/nexus-brain-3d.mp4")}
          trimBefore={15}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          fontFamily: display,
          textTransform: "uppercase",
          lineHeight: 0.95,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 150,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <RevealLine delay={6} bleed={30} style={{ fontSize: 190 }}>
            <ChromeText glow={0.6} sweepAt={30}>
              Interactive
            </ChromeText>
          </RevealLine>
          <RevealLine delay={14} bleed={30} style={{ fontSize: 190 }}>
            <ChromeText color={colors.electric} glow={0.3} sweepAt={40}>
              3D web.
            </ChromeText>
          </RevealLine>
        </div>

        <Interactive.Div
          name="Browser label"
          style={{
            position: "absolute",
            top: 1590,
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontFamily: body,
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: 8,
            color: colors.ice,
            opacity: interpolate(frame, [40, 52], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [40, 56], ["0px 30px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
            }),
          }}
        >
          <div style={{ width: 60, height: 3, background: colors.electric }} />
          LIVE IN THE BROWSER
          <div style={{ width: 60, height: 3, background: colors.electric }} />
        </Interactive.Div>
      </AbsoluteFill>

      <Atmosphere vignette={0.5} />

      <Sfx name="whoosh" at={0} volume={0.4} />
      <Sfx name="vine-boom" at={14} volume={0.4} />
      <Sfx name="shutter-modern" at={40} volume={0.2} />
    </AbsoluteFill>
  );
};
