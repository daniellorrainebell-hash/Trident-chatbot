import React from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { ChromeText } from "../components/ChromeText";
import { RevealLine } from "../components/RevealLine";
import { Sfx } from "../components/Sfx";
import { colors, display } from "../theme";

const logoClip = staticFile("video/nexus-logo-3d.mp4");

// One shot of the 3D logo footage. Scaled up from the bottom edge so the
// burned-in web address at the top of the source clip is cropped out.
const Shot: React.FC<{ from: number; duration: number; trimSeconds: number; name: string }> = ({
  from,
  duration,
  trimSeconds,
  name,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={from} durationInFrames={duration} name={name}>
      <AbsoluteFill style={{ transformOrigin: "50% 100%", scale: 1.14 }}>
        <Video
          src={logoClip}
          trimBefore={Math.round(trimSeconds * fps)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </Sequence>
  );
};

// Scene 2 — The turn. Fast cuts of the 3D logo close-ups: "THEY STOP FOR 3D."
export const Scene2Turn: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill name="Turn" style={{ backgroundColor: colors.black }}>
      <Shot name="Shot N pillar" from={0} duration={46} trimSeconds={0.2} />
      <Shot name="Shot Q" from={46} duration={46} trimSeconds={41.6} />
      <Shot name="Shot NE" from={92} duration={70} trimSeconds={51.4} />

      <Interactive.Div
        name="Cut flash"
        style={{
          position: "absolute",
          inset: 0,
          background: colors.ice,
          mixBlendMode: "screen",
          opacity: interpolate(frame, [0, 6, 46, 52, 92, 98], [0.8, 0, 0.7, 0, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(3,5,11,0.55) 0%, transparent 25%, transparent 45%, rgba(3,5,11,0.92) 78%)",
        }}
      />

      <AbsoluteFill
        style={{
          padding: "0 90px 170px",
          justifyContent: "flex-end",
          fontFamily: display,
          lineHeight: 0.9,
          textTransform: "uppercase",
        }}
      >
        <RevealLine delay={6} style={{ fontSize: 190, color: colors.chrome }}>
          They stop
        </RevealLine>
        <Interactive.Div
          name="FOR 3D"
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 30,
            transformOrigin: "0% 100%",
            scale: interpolate(frame, [48, 62], [1.35, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
          }}
        >
          <RevealLine delay={18} style={{ fontSize: 190, color: colors.chrome }}>
            for
          </RevealLine>
          <RevealLine delay={48} bleed={60} style={{ fontSize: 470, letterSpacing: -6 }}>
            <ChromeText
              glow={interpolate(frame, [48, 60, 150], [0, 1.4, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            >
              3D.
            </ChromeText>
          </RevealLine>
        </Interactive.Div>
      </AbsoluteFill>

      <Atmosphere vignette={0.7} />

      <Sfx name="whoosh" at={6} volume={0.35} />
      <Sfx name="whip" at={46} volume={0.45} />
      <Sfx name="vine-boom" at={48} volume={0.55} />
      <Sfx name="whip" at={92} volume={0.45} />
    </AbsoluteFill>
  );
};
