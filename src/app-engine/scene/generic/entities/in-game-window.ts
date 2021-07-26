import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {LoadableGraphics} from '../../../../app/scene/generic-scene/graphics/loadable-graphics';
import {GenericWriterService} from '../writers/generic-writer.service';


export enum InGameWindowState {
  OPEN = 'open',
  CLOSED = 'closed',
  OPENING = 'opening',
  CLOSING = 'closing',
}

export interface InGameWindow extends LoadableGraphics {
  state: InGameWindowState;
  lastState: InGameWindowState;

  draw(
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    state: InGameWindowState,
    renderParams: { width: number, height: number, interpolation: number }
  ): void;

  onTick(writer: GenericWriterService): void;
}
