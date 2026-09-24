import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { CheckIcon } from "../components/BenefitCard";
import { ClayBackground } from "../components/ClayBackground";
import { ClayPill } from "../components/ClayPill";
import { ClipCard } from "../components/ClipCard";
import { LogoBug } from "../components/LogoBug";
import { Accent, RevealLine } from "../components/RevealLine";
import { colors } from "../theme";

// Scene 4: the business that answered does the job; happy customer.
// Mirrors Scene 2's "Missed call / Job lost" pill with a positive one.
export const SceneWon: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Scene 4 - Won">
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
          The job goes to
        </RevealLine>
        <RevealLine name="Line 2" delay={0.8} size={104}>
          <Accent>whoever answers.</Accent>
        </RevealLine>
      </div>
      <ClipCard src="assets/clip4.mp4" top={440} width={900} height={1138} volume={0.9} />
      <ClayPill
        name="Job won"
        delay={4.2}
        top={1400}
        width={680}
        iconBg={colors.blue}
        icon={<CheckIcon />}
        title="Job won"
        subtitle="Happy customer"
      />
      <LogoBug />
      <Sequence from={Math.round(0.45 * fps)} name="SFX whoosh">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={Math.round(4.2 * fps)} name="SFX job won">
        <Audio src={staticFile("sfx/glass_002.ogg")} volume={0.4} />
      </Sequence>
    </AbsoluteFill>
  );
};
