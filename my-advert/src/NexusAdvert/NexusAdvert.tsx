import React from "react";
import { TransitionSeries } from "@remotion/transitions";
import { Scene1Hook } from "./scenes/Scene1Hook";

// Nexus IQ — 3D Visuals advert (9:16, 30s).
// Story: problem (flat) → turn (3D) → brand → proof → services → call to action.
export const NexusAdvert: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={110} name="1 Hook">
        <Scene1Hook />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
