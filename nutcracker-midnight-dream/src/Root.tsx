import React from 'react';
import {Composition} from 'remotion';
import timeline from './timeline.json';
import {Sheet} from './Sheet';
import {NutcrackerDream} from './NutcrackerDream';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="NutcrackerDream"
      component={NutcrackerDream}
      durationInFrames={timeline.durationInFrames}
      fps={timeline.fps}
      width={timeline.width}
      height={timeline.height}
    />
    <Composition id="ModelSheet" component={Sheet} durationInFrames={60} fps={30} width={1080} height={1920} />
  </>
);
