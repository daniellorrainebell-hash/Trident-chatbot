import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, serif } from "../theme";

type Props = {
  children: React.ReactNode;
  // seconds after scene start
  delay: number;
  size: number;
  font?: string;
  weight?: number;
  color?: string;
  letterSpacing?: number;
  name: string;
};

// One line of copy that settles into place: soft fade, small rise and a
// de-blur, driven by a no-bounce spring. Deliberately calm, never punchy.
export const RevealLine: React.FC<Props> = ({
  children,
  delay,
  size,
  font = serif,
  weight = 400,
  color = colors.ink,
  letterSpacing = -0.5,
  name,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = delay * fps;
  const blur = interpolate(frame, [start, start + 0.9 * fps], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      data-name={name}
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing,
        lineHeight: 1.08,
        whiteSpace: "nowrap",
        textAlign: "center",
        // Clay emboss: light catch on top, soft cast shadow below
        textShadow:
          "0 2px 0 rgba(255,255,255,0.55), 0 8px 18px rgba(92,62,40,0.16)",
        opacity: interpolate(frame, [start, start + 0.8 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [start, start + 1 * fps], ["0px 36px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
        }),
        filter: `blur(${blur}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Accent word inside a line: Nexus blue, italic serif.
export const Accent: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = colors.blue,
}) => (
  <span style={{ fontStyle: "italic", fontWeight: 700, color }}>{children}</span>
);
