import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { ClayBackground } from "../components/ClayBackground";
import { ClipCard } from "../components/ClipCard";
import { LogoBug } from "../components/LogoBug";
import { Accent, RevealLine } from "../components/RevealLine";
import { colors } from "../theme";

// Scene 1: homeowner discovers a burst pipe and reaches for the phone.
export const SceneLeak: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Scene 1 - Leak">
      <ClayBackground />
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <RevealLine name="Line 1" delay={0.5} size={66} color={colors.inkSoft}>
          When something goes wrong,
        </RevealLine>
        <RevealLine name="Line 2" delay={0.8} size={104}>
          they call <Accent>you.</Accent>
        </RevealLine>
      </div>
      <ClipCard src="assets/clip1.mp4" top={440} width={900} height={1138} volume={1} />
      <LogoBug />
      <Sequence from={Math.round(0.45 * fps)} name="SFX whoosh">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.12} />
      </Sequence>
    </AbsoluteFill>
  );
};
