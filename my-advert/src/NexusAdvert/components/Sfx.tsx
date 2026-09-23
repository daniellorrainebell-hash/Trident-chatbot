import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";

export type SfxName =
  | "whoosh"
  | "whip"
  | "switch"
  | "shutter-modern"
  | "ding"
  | "vine-boom";

// A one-shot sound effect starting at `at` frames into the parent sequence.
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({
  name,
  at,
  volume = 0.6,
}) => {
  return (
    <Sequence from={at} layout="none" name={`SFX ${name}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};
