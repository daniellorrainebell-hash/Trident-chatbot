import "./index.css";
import { Composition, Folder } from "remotion";
import { Advert } from "./Advert";
import { Intro } from "./scenes/Intro";
import { SceneLeak } from "./scenes/SceneLeak";
import { SceneMissed } from "./scenes/SceneMissed";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AIReceptionistAd"
        component={Advert}
        durationInFrames={534}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Scenes">
        <Composition id="Intro" component={Intro} durationInFrames={90} fps={30} width={1080} height={1920} />
        <Composition id="Scene1-Leak" component={SceneLeak} durationInFrames={240} fps={30} width={1080} height={1920} />
        <Composition id="Scene2-Missed" component={SceneMissed} durationInFrames={240} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
