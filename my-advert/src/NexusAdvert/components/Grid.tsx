import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";

type Props = {
  /** 0 = flat grid facing the camera, 1 = full 3D perspective floor. */
  tilt: number;
  /** 0 = dull grey lines, 1 = electric-blue glowing lines. */
  glow: number;
  /** How fast the floor scrolls toward the camera (px per frame). */
  speed?: number;
  opacity?: number;
};

// The visual metaphor of the advert: a flat, lifeless grid that tilts into a
// glowing 3D floor.
export const Grid: React.FC<Props> = ({ tilt, glow, speed = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const line = interpolateColors(
    glow,
    [0, 1],
    ["rgba(120,128,142,0.3)", "rgba(61,139,255,0.85)"],
  );

  return (
    <AbsoluteFill
      style={{ perspective: 1100, perspectiveOrigin: "50% 38%", opacity }}
    >
      <div
        style={{
          position: "absolute",
          left: "-100%",
          width: "300%",
          top: "-10%",
          height: "140%",
          transformOrigin: "50% 62%",
          rotate: `x ${tilt * 76}deg`,
          translate: `0 ${tilt * 22}%`,
          backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`,
          backgroundSize: "120px 120px",
          backgroundPosition: `center ${frame * speed}px`,
          maskImage: `linear-gradient(to top, black 35%, rgba(0,0,0,${1 - tilt}) 85%)`,
          filter: `drop-shadow(0 0 ${glow * 10}px rgba(30,107,255,${glow * 0.9}))`,
        }}
      />
    </AbsoluteFill>
  );
};
