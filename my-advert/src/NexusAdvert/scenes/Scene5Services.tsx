import React from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
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

// One numbered service row: slides in from the right, its divider draws in,
// then it "lights up" blue when its turn comes in the highlight cycle.
const ServiceRow: React.FC<{
  index: string;
  at: number;
  highlightAt: number;
  children: React.ReactNode;
}> = ({ index, at, highlightAt, children }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [at, at + 18], [700, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 200 }),
  });
  const lit = interpolate(
    frame,
    [highlightAt, highlightAt + 4, highlightAt + 16, highlightAt + 24],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div style={{ position: "relative", paddingBottom: 26, marginBottom: 30 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          translate: `${x}px 0`,
          opacity: interpolate(frame, [at, at + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontFamily: body,
            fontWeight: 800,
            fontSize: 44,
            color: colors.electric,
            width: 76,
          }}
        >
          {index}
        </div>
        <div style={{ fontFamily: display, fontSize: 98, lineHeight: 1, whiteSpace: "nowrap" }}>
          <ChromeText
            glow={0.35 + lit * 0.5}
            sweepAt={highlightAt}
            color={lit > 0.5 ? colors.ice : colors.chrome}
          >
            {children}
          </ChromeText>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 3,
          width: "100%",
          transformOrigin: "0% 50%",
          scale: `${interpolate(frame, [at + 6, at + 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })} 1`,
          background: `linear-gradient(90deg, ${colors.electric}, rgba(61,139,255,0.1))`,
          boxShadow: `0 0 ${10 + lit * 20}px rgba(30,107,255,${0.4 + lit * 0.5})`,
        }}
      />
    </div>
  );
};

// Scene 5 — Services. "WE BUILD" with a staggered, numbered list.
export const Scene5Services: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill name="Services" style={{ backgroundColor: colors.black }}>
      {/* Blue smoke from the 3D logo footage, blurred into an ambient backdrop. */}
      <AbsoluteFill
        style={{
          scale: 1.3,
          filter: "blur(28px) brightness(0.45) saturate(1.3)",
        }}
      >
        <Video
          src={staticFile("video/nexus-logo-3d.mp4")}
          trimBefore={23 * 30}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <Grid tilt={1} glow={1} speed={9} opacity={0.35} />

      <AbsoluteFill
        style={{
          padding: "0 90px",
          scale: interpolate(frame, [0, 170], [1.03, 1]),
        }}
      >
        <div
          style={{
            marginTop: 330,
            marginBottom: 100,
            fontFamily: display,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          <RevealLine delay={4} bleed={30} style={{ fontSize: 210 }}>
            <ChromeText glow={0.6} sweepAt={20}>
              We build
            </ChromeText>
          </RevealLine>
        </div>

        <ServiceRow index="01" at={22} highlightAt={70}>
          3D LOGO REVEALS
        </ServiceRow>
        <ServiceRow index="02" at={30} highlightAt={84}>
          PRODUCT RENDERS
        </ServiceRow>
        <ServiceRow index="03" at={38} highlightAt={98}>
          CGI CHARACTERS
        </ServiceRow>
        <ServiceRow index="04" at={46} highlightAt={112}>
          ANIMATED SOCIAL ADS
        </ServiceRow>

        <div
          style={{
            marginTop: 60,
            fontFamily: body,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: 10,
            color: colors.ice,
            opacity: interpolate(frame, [128, 140], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [128, 144], ["0px 30px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
            }),
          }}
        >
          BUILT TO STOP THE SCROLL.
        </div>
      </AbsoluteFill>

      <Atmosphere vignette={0.6} />

      <Sfx name="whoosh" at={0} volume={0.4} />
      <Sfx name="vine-boom" at={4} volume={0.35} />
      <Sfx name="whip" at={22} volume={0.3} />
      <Sfx name="whip" at={30} volume={0.3} />
      <Sfx name="whip" at={38} volume={0.3} />
      <Sfx name="whip" at={46} volume={0.3} />
      <Sfx name="switch" at={70} volume={0.3} />
      <Sfx name="switch" at={84} volume={0.3} />
      <Sfx name="switch" at={98} volume={0.3} />
      <Sfx name="switch" at={112} volume={0.3} />
      <Sfx name="shutter-modern" at={128} volume={0.25} />
    </AbsoluteFill>
  );
};
