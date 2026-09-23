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

const robot = staticFile("video/nexus-robot.mp4");

// A service tag that slides in from the side of the showcase panel.
const Tag: React.FC<{
  at: number;
  side: "left" | "right";
  top: number;
  children: React.ReactNode;
}> = ({ at, side, top, children }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [at, at + 16], [side === "left" ? -520 : 520, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 200 }),
  });
  return (
    <div
      style={{
        position: "absolute",
        top,
        [side]: 40,
        translate: `${x}px 0`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 28px",
        borderRadius: 999,
        background: "rgba(3,5,11,0.82)",
        border: `2px solid ${colors.electric}`,
        boxShadow: `0 0 28px rgba(30,107,255,0.45)`,
        fontFamily: body,
        fontWeight: 800,
        fontSize: 32,
        letterSpacing: 4,
        color: colors.chrome,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          background: colors.electric,
          boxShadow: `0 0 12px ${colors.electric}`,
        }}
      />
      {children}
    </div>
  );
};

// HUD-style corner bracket on the showcase panel.
const Corner: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      position: "absolute",
      width: 70,
      height: 70,
      borderColor: colors.electric,
      borderStyle: "solid",
      borderWidth: 0,
      ...style,
    }}
  />
);

// Scene 4 — Proof. The Nexus IQ robot in a glowing showcase panel:
// "CHARACTERS WITH PRESENCE."
export const Scene4Proof: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill name="Proof" style={{ backgroundColor: colors.black }}>
      {/* Ambient backdrop: the same footage, blown up, blurred and tinted. */}
      <AbsoluteFill
        style={{
          scale: 1.6,
          filter: "blur(40px) brightness(0.35) saturate(1.4)",
        }}
      >
        <Video
          src={robot}
          trimBefore={5 * 30}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 52%, rgba(30,107,255,0.35), transparent 70%)",
        }}
      />

      <AbsoluteFill style={{ perspective: 1600 }}>
        <Interactive.Div
          name="Showcase panel"
          style={{
            position: "absolute",
            left: 180,
            top: 350,
            width: 720,
            height: 1175,
            borderRadius: 28,
            overflow: "hidden",
            border: `2px solid rgba(61,139,255,0.9)`,
            boxShadow:
              "0 0 60px rgba(30,107,255,0.55), 0 40px 120px rgba(0,0,0,0.8)",
            opacity: interpolate(frame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [0, 22], ["0px 260px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
            }),
            rotate: interpolate(frame, [0, 180], ["y -10deg", "y 6deg"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.33, 1, 0.68, 1),
            }),
          }}
        >
          {/* Scaled from the top so the source watermark (bottom-right) is cropped. */}
          <Video
            src={robot}
            trimBefore={5 * 30}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              scale: 1.1,
              transformOrigin: "50% 20%",
              filter: "contrast(1.12) saturate(1.2)",
            }}
          />
          {/* Scan-light passing down the panel. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 220,
              top: interpolate(frame, [14, 44], [-240, 1200], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.45, 0, 0.2, 1),
              }),
              background:
                "linear-gradient(180deg, transparent, rgba(169,200,255,0.35) 50%, transparent)",
              mixBlendMode: "screen",
            }}
          />
          <Corner style={{ left: 22, top: 22, borderLeftWidth: 5, borderTopWidth: 5 }} />
          <Corner style={{ right: 22, top: 22, borderRightWidth: 5, borderTopWidth: 5 }} />
          <Corner style={{ left: 22, bottom: 22, borderLeftWidth: 5, borderBottomWidth: 5 }} />
          <Corner style={{ right: 22, bottom: 22, borderRightWidth: 5, borderBottomWidth: 5 }} />
        </Interactive.Div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          fontFamily: display,
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        <div style={{ position: "absolute", top: 120 }}>
          <RevealLine delay={8} bleed={30} style={{ fontSize: 200 }}>
            <ChromeText glow={0.6} sweepAt={30}>
              Characters
            </ChromeText>
          </RevealLine>
        </div>
        <div style={{ position: "absolute", top: 1575 }}>
          <RevealLine delay={36} bleed={30} style={{ fontSize: 150 }}>
            <ChromeText color={colors.electric} glow={0.3} sweepAt={58}>
              with presence.
            </ChromeText>
          </RevealLine>
        </div>
      </AbsoluteFill>

      <Tag at={70} side="left" top={640}>
        CGI CHARACTERS
      </Tag>
      <Tag at={80} side="right" top={930}>
        MASCOT DESIGN
      </Tag>
      <Tag at={90} side="left" top={1220}>
        BRAND AVATARS
      </Tag>

      <Atmosphere vignette={0.45} />

      <Sfx name="whoosh" at={0} volume={0.45} />
      <Sfx name="vine-boom" at={8} volume={0.35} />
      <Sfx name="whoosh" at={36} volume={0.35} />
      <Sfx name="switch" at={70} volume={0.4} />
      <Sfx name="switch" at={80} volume={0.4} />
      <Sfx name="switch" at={90} volume={0.4} />
    </AbsoluteFill>
  );
};
