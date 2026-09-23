import "./index.css";
import { Composition, Folder } from "remotion";
import { NexusAdvert } from "./NexusAdvert/NexusAdvert";
import { Scene1Hook } from "./NexusAdvert/scenes/Scene1Hook";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NexusAdvert"
        component={NexusAdvert}
        durationInFrames={110}
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
      </Folder>
    </>
  );
};
