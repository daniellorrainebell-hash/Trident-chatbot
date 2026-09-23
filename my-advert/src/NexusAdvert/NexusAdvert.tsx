import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Turn } from "./scenes/Scene2Turn";
import { Scene3Brand } from "./scenes/Scene3Brand";
import { Scene4Proof } from "./scenes/Scene4Proof";

// Nexus IQ — 3D Visuals advert (9:16, 30s).
// Story: problem (flat) → turn (3D) → brand → proof → services → call to action.
export const NexusAdvert: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={110} name="1 Hook">
        <Scene1Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />
      <TransitionSeries.Sequence durationInFrames={150} name="2 Turn">
        <Scene2Turn />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={140} name="3 Brand">
        <Scene3Brand />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={180} name="4 Proof">
        <Scene4Proof />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
