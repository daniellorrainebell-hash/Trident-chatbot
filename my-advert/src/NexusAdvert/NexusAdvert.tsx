import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Turn } from "./scenes/Scene2Turn";
import { Scene3Brand } from "./scenes/Scene3Brand";
import { Scene4Proof } from "./scenes/Scene4Proof";
import { Scene4bWeb3D } from "./scenes/Scene4bWeb3D";
import { Scene5Services } from "./scenes/Scene5Services";
import { Scene6CallToAction } from "./scenes/Scene6CallToAction";

// Nexus IQ — 3D Visuals advert (9:16, ~31s).
// Story: problem (flat) → turn (3D) → brand → proof (characters, web 3D) →
// services → call to action.
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
      <TransitionSeries.Sequence durationInFrames={140} name="2 Turn">
        <Scene2Turn />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={130} name="3 Brand">
        <Scene3Brand />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={150} name="4 Proof">
        <Scene4Proof />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={120} name="4b Web 3D">
        <Scene4bWeb3D />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={170} name="5 Services">
        <Scene5Services />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={190} name="6 Call to action">
        <Scene6CallToAction />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
