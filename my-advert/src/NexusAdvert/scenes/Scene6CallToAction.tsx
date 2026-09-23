import React from "react";
import { Video } from "@remotion/media";
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
import { body, colors, contact, display } from "../theme";

const logo = staticFile("img/nexus-logo.png");

const icons = {
  phone:
    "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
  email:
    "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.4 7H19.6zM4 8.6V17h16V8.6l-8 5.4z",
  web: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4a14 14 0 0 1 1.9 4h-3.8A14 14 0 0 1 12 4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h3a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6A15.7 15.7 0 0 0 8.1 8zM12 20a14 14 0 0 1-1.9-4h3.8A14 14 0 0 1 12 20zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.2 5.6a15.7 15.7 0 0 0 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z",
};

// One contact line: glowing icon badge + detail, sliding in from the left.
const ContactRow: React.FC<{
  at: number;
  icon: keyof typeof icons;
  children: React.ReactNode;
}> = ({ at, icon, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        opacity: interpolate(frame, [at, at + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [at, at + 18], ["-160px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
        }),
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          border: `2px solid ${colors.electric}`,
          background: "rgba(30,107,255,0.18)",
          boxShadow: "0 0 24px rgba(30,107,255,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={42} height={42} viewBox="0 0 24 24">
          <path d={icons[icon]} fill={colors.chrome} />
        </svg>
      </div>
      <div
        style={{
          fontFamily: body,
          fontWeight: 700,
          fontSize: 54,
          color: colors.chrome,
          letterSpacing: 0.5,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Layout keeps everything above ~1640px so the Reels/TikTok caption area
// at the bottom of the screen never covers the contact details.
// Scene 6 — Call to action. "YOUR BRAND. IN 3D." + logo, quote button and
// contact details, with Nexus IQ's core AI services listed underneath.
export const Scene6CallToAction: React.FC = () => {
  const frame = useCurrentFrame();

  const sheen = interpolate(frame, [150, 176], [-40, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill name="Call to action" style={{ backgroundColor: colors.black }}>
      <AbsoluteFill
        style={{ scale: 1.3, filter: "blur(30px) brightness(0.4) saturate(1.3)" }}
      >
        <Video
          src={staticFile("video/nexus-logo-3d.mp4")}
          trimBefore={30 * 30}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <Grid tilt={1} glow={1} speed={6} opacity={0.4} />

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 190,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: display,
            textTransform: "uppercase",
            lineHeight: 0.95,
          }}
        >
          <RevealLine delay={4} bleed={30} style={{ fontSize: 180 }}>
            <ChromeText glow={0.6} sweepAt={24}>
              Your brand.
            </ChromeText>
          </RevealLine>
          <Interactive.Div
            name="IN 3D"
            style={{
              scale: interpolate(frame, [12, 26], [1.4, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 200 }),
                output: "perceptual-scale",
              }),
            }}
          >
            <RevealLine delay={12} bleed={40} style={{ fontSize: 250 }}>
              <ChromeText color={colors.electric} glow={0.35} sweepAt={32} sweepEvery={60}>
                In 3D.
              </ChromeText>
            </RevealLine>
          </Interactive.Div>
        </div>

        <Interactive.Div
          name="Logo"
          style={{
            position: "absolute",
            top: 630,
            width: 700,
            height: 280,
            opacity: interpolate(frame, [30, 42], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [30, 50], [0.85, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
            filter: "drop-shadow(0 0 26px rgba(30,107,255,0.55))",
          }}
        >
          <Img src={logo} style={{ width: "100%", height: "100%" }} />
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
          name="Get a quote button"
          style={{
            position: "absolute",
            top: 950,
            padding: "26px 80px",
            borderRadius: 999,
            background: colors.blue,
            fontFamily: display,
            fontSize: 84,
            letterSpacing: 3,
            color: "#FFFFFF",
            boxShadow: `0 0 ${interpolate(frame, [60, 90, 120, 150, 180, 208], [30, 70, 30, 70, 30, 70])}px rgba(30,107,255,0.8), inset 0 2px 0 rgba(255,255,255,0.35)`,
            opacity: interpolate(frame, [50, 58], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [50, 66], [0.6, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 12 }),
              output: "perceptual-scale",
            }),
          }}
        >
          GET A QUOTE
        </Interactive.Div>

        <div
          style={{
            position: "absolute",
            top: 1165,
            left: 130,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <ContactRow at={66} icon="phone">
            {contact.phone}
          </ContactRow>
          <ContactRow at={74} icon="email">
            {contact.email}
          </ContactRow>
          <ContactRow at={82} icon="web">
            {contact.web}
          </ContactRow>
        </div>

        <Interactive.Div
          name="Core services"
          style={{
            position: "absolute",
            top: 1545,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            fontFamily: body,
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 5,
            color: colors.ice,
            opacity: interpolate(frame, [100, 116], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div>AI VOICE AGENTS · AUTOMATION</div>
          <div style={{ color: colors.steel }}>AI CONSULTANCY · 3D VISUALS</div>
        </Interactive.Div>
      </AbsoluteFill>

      <Atmosphere vignette={0.55} />

      <Sfx name="whoosh" at={4} volume={0.4} />
      <Sfx name="vine-boom" at={12} volume={0.5} />
      <Sfx name="shutter-modern" at={32} volume={0.25} />
      <Sfx name="switch" at={50} volume={0.45} />
      <Sfx name="whip" at={66} volume={0.25} />
      <Sfx name="whip" at={74} volume={0.25} />
      <Sfx name="whip" at={82} volume={0.25} />
      <Sfx name="ding" at={152} volume={0.25} />
    </AbsoluteFill>
  );
};
