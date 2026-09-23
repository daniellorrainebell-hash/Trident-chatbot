import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { Grid } from "../components/Grid";
import { RevealLine } from "../components/RevealLine";
import { Sfx } from "../components/Sfx";
import { colors, display } from "../theme";

// Scene 1 — The hook. "PEOPLE SCROLL PAST FLAT." The word FLAT is crushed,
// and the flat grid behind it tilts into a glowing 3D floor.
export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const tilt = interpolate(frame, [64, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill name="Hook" style={{ backgroundColor: colors.black }}>
      <Grid tilt={tilt} glow={tilt} speed={tilt * 9} />

      <Interactive.Div
        name="Horizon glow"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1080,
          height: 360,
          background:
            "radial-gradient(ellipse 80% 22% at 50% 50%, rgba(61,139,255,0.7), rgba(30,107,255,0.18) 45%, transparent 75%)",
          opacity: interpolate(frame, [80, 108], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <AbsoluteFill
        style={{
          padding: "0 90px",
          justifyContent: "center",
          fontFamily: display,
          lineHeight: 0.92,
          textTransform: "uppercase",
          scale: interpolate(frame, [0, 110], [1, 1.05]),
        }}
      >
        <RevealLine delay={4} exitAt={60} style={{ fontSize: 200, color: colors.chrome }}>
          People
        </RevealLine>
        <RevealLine delay={9} exitAt={61} style={{ fontSize: 200, color: colors.chrome }}>
          scroll
        </RevealLine>
        <RevealLine delay={14} exitAt={62} style={{ fontSize: 200, color: colors.chrome }}>
          past
        </RevealLine>
        <Interactive.Div
          name="FLAT"
          style={{
            transformOrigin: "50% 80%",
            scale: interpolate(frame, [56, 66], ["1 1", "1.08 0.02"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
            opacity: interpolate(frame, [64, 68], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <RevealLine delay={26} style={{ fontSize: 400, color: colors.flat, letterSpacing: -4 }}>
            Flat.
          </RevealLine>
        </Interactive.Div>
      </AbsoluteFill>

      <Interactive.Div
        name="Crush flash"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1070,
          height: 6,
          background: colors.electric,
          boxShadow: `0 0 40px 12px ${colors.blue}`,
          scale: interpolate(frame, [64, 72], ["0 1", "1 1"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [64, 66, 80, 92], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <Atmosphere />

      <Sfx name="whoosh" at={4} volume={0.35} />
      <Sfx name="whoosh" at={9} volume={0.3} />
      <Sfx name="whoosh" at={14} volume={0.3} />
      <Sfx name="vine-boom" at={26} volume={0.45} />
      <Sfx name="whip" at={58} volume={0.5} />
      <Sfx name="whoosh" at={70} volume={0.7} />
    </AbsoluteFill>
  );
};
