import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, sans } from "../theme";

type Props = {
  name: string;
  // seconds after scene start
  delay: number;
  icon: React.ReactNode;
  children: React.ReactNode;
};

// Small clay tile: blue icon bead on top, short benefit label below.
export const BenefitCard: React.FC<Props> = ({ name, delay, icon, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = delay * fps;

  return (
    <div
      data-name={name}
      style={{
        width: 296,
        height: 186,
        borderRadius: 40,
        backgroundColor: colors.creamLight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        boxShadow:
          "inset 0 3px 0 rgba(255,255,255,0.9), inset 0 -6px 12px rgba(150,110,80,0.12), 0 18px 34px rgba(92,62,40,0.18)",
        opacity: interpolate(frame, [start, start + 0.6 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [start, start + 0.9 * fps], ["0px 32px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
        }),
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
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
      <div
        style={{
          fontFamily: sans,
          fontSize: 34,
          fontWeight: 700,
          color: colors.ink,
          letterSpacing: -0.3,
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const stroke = { stroke: "#FFF8EE", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

export const ClockIcon = () => (
  <svg width={38} height={38} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={9} {...stroke} />
    <path d="M12 7v5l3.5 2" {...stroke} />
  </svg>
);

export const CalendarIcon = () => (
  <svg width={38} height={38} viewBox="0 0 24 24">
    <rect x={3.5} y={5} width={17} height={15.5} rx={3} {...stroke} />
    <path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4" {...stroke} />
  </svg>
);

export const CheckIcon = () => (
  <svg width={38} height={38} viewBox="0 0 24 24">
    <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />
  </svg>
);
