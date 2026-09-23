import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

type Props = {
  /** Frame (relative to the parent sequence) at which the line starts sliding in. */
  delay: number;
  /** Frame at which the line slides back out. Omit to keep it on screen. */
  exitAt?: number;
  /** Direction the text enters from. */
  from?: "bottom" | "left" | "right";
  /** Extra room (px) around the mask so glows and shadows are not clipped. */
  bleed?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

// A line of text revealed through a mask: it springs in from below (or the side)
// with no bounce, the way premium brand ads reveal headlines.
export const RevealLine: React.FC<Props> = ({
  delay,
  exitAt,
  from = "bottom",
  bleed = 0,
  children,
  style,
}) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [delay, delay + 18], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 200 }),
  });
  const exit =
    exitAt === undefined
      ? 0
      : interpolate(frame, [exitAt, exitAt + 12], [0, -1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.7, 0, 0.84, 0),
        });
  const offset = (enter + exit) * 110;

  return (
    <div
      style={{
        overflow: "hidden",
        padding: `${bleed}px ${bleed}px calc(0.04em + ${bleed}px)`,
        margin: -bleed,
      }}
    >
      <div
        style={{
          ...style,
          translate:
            from === "bottom"
              ? `0 ${offset}%`
              : `${from === "left" ? -offset : offset}% 0`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
