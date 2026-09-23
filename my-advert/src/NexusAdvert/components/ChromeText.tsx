import React from "react";
import { chromeGradient } from "../theme";

// Brushed-chrome headline text with an electric-blue under-glow, matching the logo.
export const ChromeText: React.FC<{
  children: React.ReactNode;
  glow?: number;
  style?: React.CSSProperties;
}> = ({ children, glow = 1, style }) => {
  return (
    <span
      style={{
        display: "inline-block",
        backgroundImage: chromeGradient,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        filter: `drop-shadow(0 4px 0 rgba(30,107,255,${0.9 * glow})) drop-shadow(0 0 ${28 * glow}px rgba(30,107,255,${0.65 * glow}))`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
