import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, sans } from "../theme";

type Props = {
  name: string;
  // seconds after scene start
  delay: number;
  top: number;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  width?: number;
};

// A soft, rounded clay "notification" that eases up into place.
export const ClayPill: React.FC<Props> = ({
  name,
  delay,
  top,
  icon,
  iconBg,
  title,
  subtitle,
  width = 700,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = delay * fps;

  return (
    <div
      data-name={name}
      style={{
        position: "absolute",
        top,
        left: (1080 - width) / 2,
        width,
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "24px 34px 24px 24px",
        borderRadius: 999,
        backgroundColor: colors.creamLight,
        boxShadow:
          "inset 0 3px 0 rgba(255,255,255,0.9), inset 0 -6px 12px rgba(150,110,80,0.14), 0 24px 44px rgba(92,62,40,0.24)",
        opacity: interpolate(frame, [start, start + 0.6 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [start, start + 0.9 * fps], ["0px 40px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
        }),
        scale: interpolate(frame, [start, start + 0.9 * fps], [0.94, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
          output: "perceptual-scale",
        }),
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          flexShrink: 0,
          borderRadius: 999,
          backgroundColor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 4px 0 rgba(255,255,255,0.35), inset 0 -6px 10px rgba(0,0,0,0.18)",
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: sans, color: colors.ink, lineHeight: 1.15 }}>
        <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -0.5 }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 36, fontWeight: 500, color: colors.inkSoft, marginTop: 4 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const PhoneIcon: React.FC<{ missed?: boolean }> = ({ missed = false }) => (
  <svg width={50} height={50} viewBox="0 0 24 24" fill="none">
    <path
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"
      fill="#FFF8EE"
    />
    {missed ? (
      <path d="M15 3l6 6M21 3l-6 6" stroke="#FFF8EE" strokeWidth={2.2} strokeLinecap="round" />
    ) : null}
  </svg>
);
