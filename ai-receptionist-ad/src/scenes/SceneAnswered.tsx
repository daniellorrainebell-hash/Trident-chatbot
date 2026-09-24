import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { BenefitCard, CalendarIcon, CheckIcon, ClockIcon } from "../components/BenefitCard";
import { ClayBackground } from "../components/ClayBackground";
import { ClipCard } from "../components/ClipCard";
import { Accent, RevealLine } from "../components/RevealLine";
import { colors } from "../theme";

// Scene 3: the customer tries a second business; its Nexus IQ AI
// receptionist picks up (call is answered ~1s into the clip).
export const SceneAnswered: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Scene 3 - Answered">
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
          gap: 4,
        }}
      >
        <RevealLine name="Line 1" delay={0.3} size={60} color={colors.inkSoft}>
          So they call someone else.
        </RevealLine>
        <RevealLine name="Line 2" delay={0.9} size={84}>
          Their AI receptionist
        </RevealLine>
        <RevealLine name="Line 3" delay={1.15} size={84}>
          <Accent>answers.</Accent>
        </RevealLine>
      </div>
      <ClipCard src="assets/clip3.mp4" top={500} width={840} height={1062} volume={0.9} />
      <div
        style={{
          position: "absolute",
          top: 1620,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 22,
        }}
      >
        <BenefitCard name="Benefit 24/7" delay={3.2} icon={<ClockIcon />}>
          Every call, 24/7
        </BenefitCard>
        <BenefitCard name="Benefit booked" delay={3.55} icon={<CalendarIcon />}>
          Jobs booked
        </BenefitCard>
        <BenefitCard name="Benefit no lead lost" delay={3.9} icon={<CheckIcon />}>
          No lead lost
        </BenefitCard>
      </div>
      {/* AI receptionist voice; the clip's original voice is faded out at 1.0s */}
      <Sequence from={Math.round(1.1 * fps)} name="Receptionist voice">
        <Audio src={staticFile("assets/receptionist-voice.wav")} volume={0.9} />
      </Sequence>
      <Sequence from={Math.round(1.0 * fps)} name="SFX answered chime">
        <Audio src={staticFile("sfx/confirmation_001.ogg")} volume={0.4} />
      </Sequence>
      <Sequence from={Math.round(3.2 * fps)} name="SFX tick 1">
        <Audio src={staticFile("sfx/tick_001.ogg")} volume={0.25} />
      </Sequence>
      <Sequence from={Math.round(3.55 * fps)} name="SFX tick 2">
        <Audio src={staticFile("sfx/tick_001.ogg")} volume={0.25} />
      </Sequence>
      <Sequence from={Math.round(3.9 * fps)} name="SFX tick 3">
        <Audio src={staticFile("sfx/tick_001.ogg")} volume={0.25} />
      </Sequence>
    </AbsoluteFill>
  );
};
