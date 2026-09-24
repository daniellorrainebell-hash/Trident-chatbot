import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClayBackground } from "../components/ClayBackground";
import { Accent, RevealLine } from "../components/RevealLine";
import { colors, sans } from "../theme";

const stroke = {
  stroke: "#FFF8EE",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

const GlobeIcon = () => (
  <svg width={34} height={34} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={9} {...stroke} />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" {...stroke} />
  </svg>
);

const PhoneIcon = () => (
  <svg width={32} height={32} viewBox="0 0 24 24">
    <path
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"
      fill="#FFF8EE"
    />
  </svg>
);

const MailIcon = () => (
  <svg width={34} height={34} viewBox="0 0 24 24">
    <rect x={3} y={5.5} width={18} height={13} rx={2.5} {...stroke} />
    <path d="M4 7l8 6 8-6" {...stroke} />
  </svg>
);

// One contact row that eases in from the left, staggered by `delay`.
const DetailRow: React.FC<{ delay: number; icon: React.ReactNode; children: React.ReactNode }> = ({
  delay,
  icon,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = delay * fps;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        opacity: interpolate(frame, [start, start + 0.6 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [start, start + 0.9 * fps], ["-24px 0px", "0px 0px"], {
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
          flexShrink: 0,
          borderRadius: 999,
          backgroundColor: colors.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 4px 0 rgba(255,255,255,0.35), inset 0 -6px 10px rgba(0,0,0,0.2)",
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: sans, fontSize: 58, fontWeight: 600, color: colors.ink, letterSpacing: -0.3 }}>
        {children}
      </div>
    </div>
  );
};

// End card: answers "whoever answers" with "Make sure it's you", then the
// logo (with one soft light sweep), promise line, contact details, tagline.
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = staticFile("assets/logo-transparent.png");

  return (
    <AbsoluteFill name="End card">
      <ClayBackground />
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <RevealLine name="Make sure" delay={0.3} size={104} weight={600}>
          Make sure it&apos;s <Accent>you.</Accent>
        </RevealLine>
      </div>

      <Interactive.Div
        name="Logo"
        style={{
          position: "absolute",
          top: 570,
          left: 90,
          width: 900,
          height: 200,
          opacity: interpolate(frame, [1.2 * fps, 2.1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [1.2 * fps, 2.4 * fps], [0.95, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <Img
          src={logo}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 14px 22px rgba(30,60,140,0.22))",
          }}
        />
        {/* Soft light sweep, masked to the logo shape */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitMaskImage: `url(${logo})`,
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskImage: `url(${logo})`,
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            mixBlendMode: "screen",
            background: `linear-gradient(105deg, rgba(255,255,255,0) ${interpolate(
              frame,
              [2.2 * fps, 3.6 * fps],
              [-30, 110],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.55, 1) },
            )}%, rgba(255,255,255,0.75) ${interpolate(
              frame,
              [2.2 * fps, 3.6 * fps],
              [-20, 120],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.55, 1) },
            )}%, rgba(255,255,255,0) ${interpolate(
              frame,
              [2.2 * fps, 3.6 * fps],
              [-10, 130],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.55, 1) },
            )}%)`,
          }}
        />
      </Interactive.Div>

      <div style={{ position: "absolute", top: 840, left: 80, right: 80 }}>
        <RevealLine name="Promise" delay={2.0} size={80} weight={500}>
          Never miss another call.
        </RevealLine>
      </div>

      <Interactive.Div
        name="Details panel"
        style={{
          position: "absolute",
          top: 1050,
          left: 110,
          width: 860,
          padding: "56px 64px",
          borderRadius: 52,
          backgroundColor: colors.creamLight,
          display: "flex",
          flexDirection: "column",
          gap: 40,
          boxShadow:
            "inset 0 3px 0 rgba(255,255,255,0.9), inset 0 -8px 16px rgba(150,110,80,0.12), 0 30px 60px rgba(92,62,40,0.2)",
          opacity: interpolate(frame, [2.6 * fps, 3.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [2.6 * fps, 3.6 * fps], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
          }),
        }}
      >
        <DetailRow delay={2.9} icon={<GlobeIcon />}>
          www.nexus-iq.co.uk
        </DetailRow>
        <DetailRow delay={3.15} icon={<PhoneIcon />}>
          0800 193 5055
        </DetailRow>
        <DetailRow delay={3.4} icon={<MailIcon />}>
          info@nexus-iq.co.uk
        </DetailRow>
      </Interactive.Div>

      <div style={{ position: "absolute", top: 1580, left: 80, right: 80 }}>
        <RevealLine
          name="Tagline"
          delay={4.1}
          size={40}
          font={sans}
          weight={600}
          color={colors.inkSoft}
          letterSpacing={1}
        >
          Systems that scale. Intelligence that evolves.
        </RevealLine>
      </div>

      <Sequence from={Math.round(1.3 * fps)} name="SFX logo">
        <Audio src={staticFile("sfx/bong_001.ogg")} volume={0.3} />
      </Sequence>
      <Sequence from={Math.round(2.9 * fps)} name="SFX details">
        <Audio src={staticFile("sfx/pluck_001.ogg")} volume={0.2} />
      </Sequence>
    </AbsoluteFill>
  );
};
