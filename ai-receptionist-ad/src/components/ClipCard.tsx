import { Video } from "@remotion/media";
import {
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  src: string;
  top: number;
  width: number;
  height: number;
  volume?: number;
  trimBefore?: number;
};

// A clip presented like a framed print resting on the clay set:
// cream mat border, soft layered shadow, gentle rise-in and slow push-in.
export const ClipCard: React.FC<Props> = ({
  src,
  top,
  width,
  height,
  volume = 1,
  trimBefore = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <Interactive.Div
      name="Clip card"
      style={{
        position: "absolute",
        top,
        left: (1080 - width) / 2,
        width,
        height,
        borderRadius: 48,
        padding: 10,
        backgroundColor: "#FBF6EE",
        boxShadow:
          "0 2px 0 rgba(255,255,255,0.8) inset, 0 30px 60px rgba(92,62,40,0.22), 0 8px 18px rgba(92,62,40,0.14)",
        opacity: interpolate(frame, [0, 0.8 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [0, 1.1 * fps], ["0px 48px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
        }),
        scale: interpolate(frame, [0, 1.1 * fps], [0.97, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
          output: "perceptual-scale",
        }),
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 38,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Video
          name="Clip"
          src={staticFile(src)}
          trimBefore={trimBefore}
          objectFit="cover"
          volume={(f) =>
            interpolate(
              f,
              [0, 0.5 * fps, durationInFrames - 0.7 * fps, durationInFrames],
              [0, volume, volume, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
          style={{
            width: "100%",
            height: "100%",
            scale: interpolate(frame, [0, durationInFrames], [1, 1.05], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.33, 0, 0.67, 1),
            }),
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 38,
            boxShadow: "inset 0 0 40px rgba(60,40,25,0.18)",
          }}
        />
      </div>
    </Interactive.Div>
  );
};
