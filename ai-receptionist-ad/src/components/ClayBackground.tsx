import { AbsoluteFill, useCurrentFrame } from "remotion";

// Warm cream backdrop with soft top light, vignette and a clay-like grain.
// The grain seed steps every 3 frames ("on threes") to give a subtle
// stop-motion boil without drawing attention to itself.
export const ClayBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 3) % 12;

  return (
    <AbsoluteFill name="Clay background" style={{ backgroundColor: "#F4EBDD" }}>
      <AbsoluteFill
        name="Soft key light"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 18%, rgba(255,250,240,0.95) 0%, rgba(244,235,221,0) 60%)",
        }}
      />
      <AbsoluteFill
        name="Vignette"
        style={{
          background:
            "radial-gradient(140% 100% at 50% 45%, rgba(0,0,0,0) 55%, rgba(120,84,56,0.22) 100%)",
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "multiply" }}
      >
        <filter id="clay-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.24  0 0 0 0.9 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#clay-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
