import {GenericSceneRenderContext} from '../render/generic-scene-render-context';

export interface LoadableGraphics {
  isGraphicsInitialized: boolean;

  onGraphicsInit(context: GenericSceneRenderContext): Promise<void>;
}
