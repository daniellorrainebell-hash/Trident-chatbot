import "./index.css";
import { Composition, Folder } from "remotion";
import { NexusAdvert } from "./NexusAdvert/NexusAdvert";
import { Scene1Hook } from "./NexusAdvert/scenes/Scene1Hook";
import { Scene2Turn } from "./NexusAdvert/scenes/Scene2Turn";
import { Scene3Brand } from "./NexusAdvert/scenes/Scene3Brand";
import { Scene4Proof } from "./NexusAdvert/scenes/Scene4Proof";
import { Scene4bWeb3D } from "./NexusAdvert/scenes/Scene4bWeb3D";
import { Scene5Services } from "./NexusAdvert/scenes/Scene5Services";
import { Scene6CallToAction } from "./NexusAdvert/scenes/Scene6CallToAction";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NexusAdvert"
        component={NexusAdvert}
        durationInFrames={940}
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
          durationInFrames={140}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="Scene3-Brand"
          component={Scene3Brand}
          durationInFrames={130}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="Scene4-Proof"
          component={Scene4Proof}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="Scene4b-Web3D"
          component={Scene4bWeb3D}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="Scene5-Services"
          component={Scene5Services}
          durationInFrames={170}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="Scene6-CallToAction"
          component={Scene6CallToAction}
          durationInFrames={190}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};
