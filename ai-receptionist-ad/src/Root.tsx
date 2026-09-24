import "./index.css";
import { Composition, Folder } from "remotion";
import { Advert } from "./Advert";
import { Intro } from "./scenes/Intro";
import { SceneLeak } from "./scenes/SceneLeak";
import { SceneMissed } from "./scenes/SceneMissed";
import { SceneAnswered } from "./scenes/SceneAnswered";
import { SceneWon } from "./scenes/SceneWon";
import { EndCard } from "./scenes/EndCard";
import { SceneCustom } from "./scenes/SceneCustom";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AIReceptionistAd"
        component={Advert}
        durationInFrames={1377}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Scenes">
        <Composition id="Intro" component={Intro} durationInFrames={90} fps={30} width={1080} height={1920} />
        <Composition id="Scene1-Leak" component={SceneLeak} durationInFrames={240} fps={30} width={1080} height={1920} />
        <Composition id="Scene2-Missed" component={SceneMissed} durationInFrames={240} fps={30} width={1080} height={1920} />
        <Composition id="Scene3-Answered" component={SceneAnswered} durationInFrames={240} fps={30} width={1080} height={1920} />
        <Composition id="Scene4-Won" component={SceneWon} durationInFrames={240} fps={30} width={1080} height={1920} />
        <Composition id="Scene5-Custom" component={SceneCustom} durationInFrames={225} fps={30} width={1080} height={1920} />
        <Composition id="EndCard" component={EndCard} durationInFrames={210} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
