import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { ClayBackground } from "../components/ClayBackground";
import { ClayPill, PhoneIcon } from "../components/ClayPill";
import { ClipCard } from "../components/ClipCard";
import { LogoBug } from "../components/LogoBug";
import { Accent, RevealLine } from "../components/RevealLine";
import { colors } from "../theme";

// Scene 2: the first business is mid-job, the phone rings out, the job is lost.
export const SceneMissed: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Scene 2 - Missed">
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
          But you&apos;re on a job,
        </RevealLine>
        <RevealLine name="Line 2" delay={0.8} size={104}>
          and it <Accent color={colors.terracotta}>rings out.</Accent>
        </RevealLine>
      </div>
      <ClipCard src="assets/clip2.mp4" top={440} width={900} height={1138} volume={0.9} />
      <ClayPill
        name="Missed call"
        delay={5.8}
        top={1400}
        width={640}
        iconBg={colors.terracotta}
        icon={<PhoneIcon missed />}
        title="Missed call"
        subtitle="Job lost"
      />
      <LogoBug />
      <Sequence from={Math.round(0.45 * fps)} name="SFX whoosh">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={Math.round(5.8 * fps)} name="SFX missed">
        <Audio src={staticFile("sfx/minimize_001.ogg")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};
