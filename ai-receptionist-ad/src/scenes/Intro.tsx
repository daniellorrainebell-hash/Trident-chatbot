import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClayBackground } from "../components/ClayBackground";
import { Accent, RevealLine } from "../components/RevealLine";
import { colors, sans } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Intro">
      <ClayBackground />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          paddingBottom: 60,
        }}
      >
        <RevealLine
          name="Eyebrow"
          delay={0.2}
          size={34}
          font={sans}
          weight={500}
          color={colors.blueDeep}
          letterSpacing={9}
        >
          AI RECEPTIONIST
        </RevealLine>
        <Interactive.Div
          name="Rule"
          style={{
            height: 4,
            borderRadius: 4,
            backgroundColor: colors.terracotta,
            margin: "22px 0 34px",
            width: interpolate(frame, [0.4 * fps, 1.4 * fps], [0, 140], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
        <RevealLine name="Headline line 1" delay={0.55} size={132}>
          Every call
        </RevealLine>
        <RevealLine name="Headline line 2" delay={0.8} size={132}>
          is a <Accent>customer.</Accent>
        </RevealLine>
      </AbsoluteFill>
      <Sequence from={Math.round(0.5 * fps)} name="SFX pluck">
        <Audio src={staticFile("sfx/pluck_001.ogg")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};
