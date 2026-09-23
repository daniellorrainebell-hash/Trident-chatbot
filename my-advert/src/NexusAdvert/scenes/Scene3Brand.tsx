import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { ChromeText } from "../components/ChromeText";
import { Grid } from "../components/Grid";
import { RevealLine } from "../components/RevealLine";
import { Sfx } from "../components/Sfx";
import { body, colors, display } from "../theme";

const logo = staticFile("img/nexus-logo.png");

// Scene 3 — The brand. Logo lands on the glowing 3D floor, then the headline:
// "SYSTEMS THAT SCALE. INTELLIGENCE THAT EVOLVES."
export const Scene3Brand: React.FC = () => {
  const frame = useCurrentFrame();

  const sheen = interpolate(frame, [16, 40], [-40, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill name="Brand" style={{ backgroundColor: colors.black }}>
      <Grid tilt={1} glow={1} speed={9} opacity={0.55} />

      <Interactive.Div
        name="Logo halo"
        style={{
          position: "absolute",
          left: -100,
          right: -100,
          top: 180,
          height: 700,
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(30,107,255,0.45), rgba(30,107,255,0.08) 55%, transparent 75%)",
          opacity: interpolate(frame, [0, 24], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          scale: interpolate(frame, [0, 140], [1, 1.04]),
        }}
      >
        <Interactive.Div
          name="Logo"
          style={{
            position: "absolute",
            top: 250,
            width: 980,
            height: 392,
            opacity: interpolate(frame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0, 22], [1.25, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
            filter: `blur(${interpolate(frame, [0, 16], [24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px) drop-shadow(0 0 30px rgba(30,107,255,0.55))`,
          }}
        >
          <Img src={logo} style={{ width: "100%", height: "100%" }} />
          {/* Specular sweep clipped to the logo's own shape. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              maskImage: `url(${logo})`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(${logo})`,
              WebkitMaskSize: "100% 100%",
              backgroundImage: `linear-gradient(105deg, transparent ${sheen - 12}%, rgba(255,255,255,0.9) ${sheen}%, transparent ${sheen + 12}%)`,
              mixBlendMode: "screen",
            }}
          />
        </Interactive.Div>

        <Interactive.Div
          name="Label"
          style={{
            position: "absolute",
            top: 690,
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontFamily: body,
            fontWeight: 800,
            fontSize: 38,
            letterSpacing: 12,
            color: colors.ice,
            opacity: interpolate(frame, [26, 38], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              height: 3,
              background: colors.electric,
              width: interpolate(frame, [26, 44], [0, 90], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          />
          PREMIUM 3D VISUALS
          <div
            style={{
              height: 3,
              background: colors.electric,
              width: interpolate(frame, [26, 44], [0, 90], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          />
        </Interactive.Div>

        <div
          style={{
            position: "absolute",
            top: 800,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: display,
            textTransform: "uppercase",
            lineHeight: 0.98,
            textAlign: "center",
          }}
        >
          <RevealLine delay={40} bleed={30} style={{ fontSize: 175 }}>
            <ChromeText glow={0.6} sweepAt={62}>
              Systems
            </ChromeText>
          </RevealLine>
          <RevealLine delay={46} bleed={30} style={{ fontSize: 175 }}>
            <ChromeText glow={0.6} sweepAt={68}>
              that scale.
            </ChromeText>
          </RevealLine>
          <RevealLine delay={72} bleed={30} style={{ fontSize: 150, marginTop: 36 }}>
            <ChromeText color={colors.electric} glow={0.3} sweepAt={96}>
              Intelligence
            </ChromeText>
          </RevealLine>
          <RevealLine delay={78} bleed={30} style={{ fontSize: 150 }}>
            <ChromeText color={colors.electric} glow={0.3} sweepAt={102}>
              that evolves.
            </ChromeText>
          </RevealLine>
        </div>
      </AbsoluteFill>

      <Atmosphere vignette={0.75} />

      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="shutter-modern" at={20} volume={0.25} />
      <Sfx name="whoosh" at={40} volume={0.35} />
      <Sfx name="vine-boom" at={46} volume={0.3} />
      <Sfx name="whoosh" at={72} volume={0.35} />
      <Sfx name="vine-boom" at={78} volume={0.35} />
    </AbsoluteFill>
  );
};
