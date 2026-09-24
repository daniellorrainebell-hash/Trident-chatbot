import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { ClayBackground } from "../components/ClayBackground";
import { ClipCard } from "../components/ClipCard";
import { LogoBug } from "../components/LogoBug";
import { Accent, RevealLine } from "../components/RevealLine";

// Scene 1: homeowner discovers a burst pipe and reaches for the phone.
export const SceneLeak: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Scene 1 - Leak">
      <ClayBackground />
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <RevealLine name="Line 1" delay={0.5} size={88} weight={500}>
          When it goes wrong,
        </RevealLine>
        <RevealLine name="Line 2" delay={0.8} size={120} weight={600}>
          they call <Accent>you.</Accent>
        </RevealLine>
      </div>
      <ClipCard src="assets/clip1.mp4" top={400} width={900} height={1138} volume={1} />
      <LogoBug />
      <Sequence from={Math.round(0.45 * fps)} name="SFX whoosh">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.12} />
      </Sequence>
    </AbsoluteFill>
  );
};
