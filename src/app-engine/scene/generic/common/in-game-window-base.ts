import {InGameWindow, InGameWindowState} from '../entities/in-game-window';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Rect} from "../../../../app/shared/interfaces/rect";


export class InGameWindowBase implements InGameWindow {
  isGraphicsInitialized = false;
  lastState: InGameWindowState = InGameWindowState.CLOSED;
  state: InGameWindowState = InGameWindowState.CLOSED;

  draw(
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    state: InGameWindowState,
    renderParams: { width: number; height: number; interpolation: number }
  ): void {
  }

  onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    return Promise.resolve(undefined);
  }

  onTick(writer: GenericWriterService): void {
  }

  protected getSizeMultiplier(state: InGameWindowState, interpolation: number): number {
    let sizeMultiplier = 1;
    if (state === InGameWindowState.OPENING) {
      sizeMultiplier = interpolation;
    } else if (state === InGameWindowState.CLOSING) {
      sizeMultiplier = 1 - interpolation;
    }
    return sizeMultiplier;
  }

  protected getWindowRect(canvasSize: { width: number, height: number }, sizeMultiplier: number): Rect {
    const { width, height } = canvasSize;
    return {
      x: width * (1 - sizeMultiplier) / 2,
      y: height * (1 - sizeMultiplier) / 2,
      width: width * sizeMultiplier,
      height: height * sizeMultiplier
    };
  }
}
