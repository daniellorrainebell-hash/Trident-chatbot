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
          But you&apos;re on a job,
        </RevealLine>
        <RevealLine name="Line 2" delay={0.8} size={120} weight={600}>
          and it <Accent>rings out.</Accent>
        </RevealLine>
      </div>
      <ClipCard src="assets/clip2.mp4" top={400} width={900} height={1138} volume={1} />
      <ClayPill
        name="Missed call"
        delay={5.8}
        top={1360}
        width={720}
        iconBg={colors.navy}
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
