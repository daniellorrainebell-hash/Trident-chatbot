import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Small, quiet brand mark that sits at the bottom of each story scene.
export const LogoBug: React.FC<{ delay?: number }> = ({ delay = 0.6 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <Img
      name="Logo bug"
      src={staticFile("assets/logo-transparent.png")}
      style={{
        position: "absolute",
        bottom: 96,
        left: 300,
        width: 480,
        opacity: interpolate(
          frame,
          [delay * fps, (delay + 0.8) * fps, durationInFrames - 0.5 * fps, durationInFrames],
          [0, 1, 1, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) },
        ),
        filter: "drop-shadow(0 4px 8px rgba(40,60,120,0.18))",
      }}
    />
  );
};
