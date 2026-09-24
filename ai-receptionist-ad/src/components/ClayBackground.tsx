import { AbsoluteFill, useCurrentFrame } from "remotion";

// Cool white backdrop with soft top light, vignette and a clay-like grain.
// The grain seed steps every 3 frames ("on threes") to give a subtle
// stop-motion boil without drawing attention to itself.
export const ClayBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 3) % 12;

  return (
    <AbsoluteFill name="Clay background" style={{ backgroundColor: "#F4F8FF" }}>
      <AbsoluteFill
        name="Soft key light"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 18%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
      <AbsoluteFill
        name="Blue glow"
        style={{
          background:
            "radial-gradient(90% 45% at 50% 105%, rgba(10,102,255,0.22) 0%, rgba(10,102,255,0) 70%), radial-gradient(60% 30% at 100% 0%, rgba(10,102,255,0.10) 0%, rgba(10,102,255,0) 70%)",
        }}
      />
      <AbsoluteFill
        name="Vignette"
        style={{
          background:
            "radial-gradient(140% 100% at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,70,200,0.16) 100%)",
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.08, mixBlendMode: "multiply" }}
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
            values="0 0 0 0 0.15  0 0 0 0 0.3  0 0 0 0 0.7  0 0 0 0.9 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#clay-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
