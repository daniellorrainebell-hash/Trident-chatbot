import { Audio } from "@remotion/media";
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
import { ClayBackground } from "../components/ClayBackground";
import { LogoBug } from "../components/LogoBug";
import { Accent, RevealLine } from "../components/RevealLine";
import { colors, sans } from "../theme";

const stroke = {
  stroke: "#FFFFFF",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

const HeadsetIcon = () => (
  <svg width={46} height={46} viewBox="0 0 24 24">
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" {...stroke} />
    <rect x={3} y={13} width={4} height={6} rx={1.5} {...stroke} />
    <rect x={17} y={13} width={4} height={6} rx={1.5} {...stroke} />
    <path d="M19 19c0 1.5-2 2.5-5 2.5" {...stroke} />
  </svg>
);

const Check = () => (
  <svg width={40} height={40} viewBox="0 0 24 24">
    <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />
  </svg>
);

// One setting in the receptionist's setup: slides in, then its check settles.
const SetupRow: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = delay * fps;
  const tick = start + 0.15 * fps;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        opacity: interpolate(frame, [start, start + 0.6 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [start, start + 0.9 * fps], ["-28px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
        }),
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          flexShrink: 0,
          borderRadius: 999,
          backgroundColor: colors.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 4px 0 rgba(255,255,255,0.35), inset 0 -6px 10px rgba(0,0,0,0.2)",
          scale: interpolate(frame, [tick, tick + 0.7 * fps], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <Check />
      </div>
      <div style={{ fontFamily: sans, fontSize: 50, fontWeight: 600, color: colors.ink, letterSpacing: -0.4 }}>
        {children}
      </div>
    </div>
  );
};

// Scene 5: every receptionist is custom built around the business.
export const SceneCustom: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rowDelays = [1.8, 2.2, 2.6, 3.0];

  return (
    <AbsoluteFill name="Scene 5 - Custom built">
      <ClayBackground />
      <div
        style={{
          position: "absolute",
          top: 170,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <RevealLine name="Line 1" delay={0.3} size={88} weight={500}>
          Every receptionist is
        </RevealLine>
        <RevealLine name="Line 2" delay={0.55} size={140} weight={600}>
          <Accent>custom built.</Accent>
        </RevealLine>
      </div>

      <Interactive.Div
        name="Setup panel"
        style={{
          position: "absolute",
          top: 500,
          left: 80,
          width: 920,
          padding: "44px 56px 52px",
          borderRadius: 52,
          backgroundColor: colors.white,
          display: "flex",
          flexDirection: "column",
          gap: 30,
          boxShadow:
            "0 0 0 3px rgba(10,102,255,0.35), inset 0 3px 0 rgba(255,255,255,0.9), inset 0 -8px 16px rgba(10,80,220,0.10), 0 30px 60px rgba(12,40,110,0.2)",
          opacity: interpolate(frame, [1.1 * fps, 1.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [1.1 * fps, 2.1 * fps], ["0px 44px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
          }),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            paddingBottom: 30,
            borderBottom: "2px solid rgba(10,102,255,0.15)",
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 999,
              background: "linear-gradient(160deg, #3D8BFF 0%, #0A66FF 55%, #0047D6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 4px 0 rgba(255,255,255,0.35), 0 10px 20px rgba(10,102,255,0.3)",
            }}
          >
            <HeadsetIcon />
          </div>
          <div style={{ fontFamily: sans, fontSize: 52, fontWeight: 700, color: colors.ink, letterSpacing: -0.6 }}>
            Your AI Receptionist
          </div>
        </div>
        <SetupRow delay={rowDelays[0]}>Trained on your services</SetupRow>
        <SetupRow delay={rowDelays[1]}>Knows your hours &amp; prices</SetupRow>
        <SetupRow delay={rowDelays[2]}>Books into your calendar</SetupRow>
        <SetupRow delay={rowDelays[3]}>Speaks in your brand voice</SetupRow>
      </Interactive.Div>

      <div
        style={{
          position: "absolute",
          top: 1270,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <RevealLine name="Built around you" delay={3.5} size={92} weight={500}>
          Built around <Accent>you</Accent>
        </RevealLine>
        <RevealLine name="and your business" delay={3.8} size={92} weight={500}>
          and <Accent>your business.</Accent>
        </RevealLine>
      </div>

      <LogoBug delay={1.0} />

      {rowDelays.map((d) => (
        <Sequence key={d} from={Math.round((d + 0.15) * fps)} name="SFX tick">
          <Audio src={staticFile("sfx/tick_001.ogg")} volume={0.2} />
        </Sequence>
      ))}
      <Sequence from={Math.round(1.1 * fps)} name="SFX panel">
        <Audio src={staticFile("sfx/pluck_001.ogg")} volume={0.2} />
      </Sequence>
    </AbsoluteFill>
  );
};
