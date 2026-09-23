import "./index.css";
import { Composition, Folder } from "remotion";
import { NexusAdvert } from "./NexusAdvert/NexusAdvert";
import { Scene1Hook } from "./NexusAdvert/scenes/Scene1Hook";
import { Scene2Turn } from "./NexusAdvert/scenes/Scene2Turn";
import { Scene3Brand } from "./NexusAdvert/scenes/Scene3Brand";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NexusAdvert"
        component={NexusAdvert}
        durationInFrames={378}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="NexusAdvert-Scenes">
        <Composition
          id="Scene1-Hook"
          component={Scene1Hook}
          durationInFrames={110}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="Scene2-Turn"
          component={Scene2Turn}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="Scene3-Brand"
          component={Scene3Brand}
          durationInFrames={140}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};
