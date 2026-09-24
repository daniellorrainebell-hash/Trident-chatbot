import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Intro } from "./scenes/Intro";
import { SceneLeak } from "./scenes/SceneLeak";
import { SceneMissed } from "./scenes/SceneMissed";
import { SceneAnswered } from "./scenes/SceneAnswered";
import { SceneWon } from "./scenes/SceneWon";
import { EndCard } from "./scenes/EndCard";

export const FADE = 18;

export const Advert: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#F4F8FF" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90} name="Intro">
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={240} name="Scene 1 - Leak">
          <SceneLeak />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={240} name="Scene 2 - Missed">
          <SceneMissed />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={240} name="Scene 3 - Answered">
          <SceneAnswered />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={240} name="Scene 4 - Won">
          <SceneWon />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={210} name="End card">
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {/* One consistent ringtone for the unanswered call, laid on the main
          timeline so ring 1 carries through the fade from her phone (scene 1)
          to his (scene 2). The clips' own ringing has been removed. */}
      <Sequence from={267} name="Ring 1 (spans scene 1 to 2)">
        <Audio src={staticFile("assets/ringtone.wav")} />
      </Sequence>
      <Sequence from={372} name="Ring 2 (plumber glances at phone)">
        <Audio src={staticFile("assets/ringtone.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};
