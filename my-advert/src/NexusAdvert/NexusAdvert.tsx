import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Turn } from "./scenes/Scene2Turn";

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
    </TransitionSeries>
  );
};
