import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

type Props = {
  children: React.ReactNode;
  /** Strength of the electric-blue under-glow. */
  glow?: number;
  /** Frame at which a specular light sweep crosses the text. Omit for no sweep. */
  sweepAt?: number;
  /** Frames between repeated sweeps after the first one. Omit to sweep once. */
  sweepEvery?: number;
  /** Solid text colour. */
  color?: string;
  style?: React.CSSProperties;
};

const SWEEP_FRAMES = 22;

// Glossy headline text: a solid fill with a blue 3D edge and glow, a moving
// specular light sweep and a star glint where the sweep exits.
export const ChromeText: React.FC<Props> = ({
  children,
  glow = 1,
  sweepAt,
  sweepEvery,
  color = colors.chrome,
  style,
}) => {
  const frame = useCurrentFrame();

  // Local time within the current sweep cycle.
  let t = -1;
  if (sweepAt !== undefined && frame >= sweepAt) {
    t = sweepEvery ? (frame - sweepAt) % sweepEvery : frame - sweepAt;
  }
  const sweep = interpolate(t, [0, SWEEP_FRAMES], [-60, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const glint = interpolate(
    t,
    [SWEEP_FRAMES - 8, SWEEP_FRAMES - 2, SWEEP_FRAMES + 10],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Brief bloom while the light passes over the letters.
  const sweepBloom = interpolate(t, [0, SWEEP_FRAMES / 2, SWEEP_FRAMES], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          display: "inline-block",
          backgroundImage: `linear-gradient(105deg, transparent ${sweep - 16}%, rgba(255,255,255,0.35) ${sweep - 7}%, #FFFFFF ${sweep}%, rgba(255,255,255,0.35) ${sweep + 7}%, transparent ${sweep + 16}%), linear-gradient(${color}, ${color})`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          filter: `drop-shadow(0 0 ${sweepBloom * 22}px rgba(255,255,255,${sweepBloom * 0.6})) drop-shadow(0 5px 0 rgba(30,107,255,${0.95 * glow})) drop-shadow(0 0 ${30 * glow}px rgba(30,107,255,${0.7 * glow}))`,
          ...style,
        }}
      >
        {children}
      </span>
      <span
        style={{
          position: "absolute",
          right: "4%",
          top: "10%",
          width: 260,
          height: 260,
          translate: "50% -50%",
          opacity: glint,
          scale: `${0.4 + glint * 0.8}`,
          rotate: `${t * 2}deg`,
          background:
            "radial-gradient(circle, #fff 0%, rgba(169,200,255,0.9) 6%, transparent 22%), linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%) center / 100% 3px no-repeat, linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%) center / 3px 100% no-repeat",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </span>
  );
};
