import {Singleton} from '../../../singleton.decorator';
import {InGameWindow, InGameWindowState} from '../entities/in-game-window';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';


@Singleton
export class InGameWindowService {
  private windows: InGameWindow[] = [];

  drawWindows(
      context: GenericSceneRenderContext,
      canvas: CanvasRenderingContext2D,
      renderParams: { width: number; height: number; interpolation: number }
  ): void {
    for (const window of this.windows) {
      if (window.state !== InGameWindowState.CLOSED) {
        window.draw(context, canvas, window.state, renderParams);
      }
    }
  }

  onTick(writer: GenericWriterService): void {
    this.windows.forEach((window, index, windows) => {
      if (window.state !== InGameWindowState.CLOSED) {
        window.onTick(writer);
      } else {
        windows.splice(index);
        return;
      }

      // update states
      window.lastState = window.state;
      if (window.state === InGameWindowState.OPENING) {
        window.state = InGameWindowState.OPEN;
      } else if (window.state === InGameWindowState.CLOSING) {
        window.state = InGameWindowState.CLOSED;
      }
    });
  }

  openWindow(window: InGameWindow): void {
    if (window.state !== InGameWindowState.OPEN) {
      // change state
      window.state = window.state === InGameWindowState.CLOSING ? InGameWindowState.OPEN : InGameWindowState.OPENING;
      // move window on top
      const windows = this.windows.filter(w => w !== window);
      windows.push(window);
      this.windows = windows;
    }
  }

  closeWindow(window: InGameWindow): void {
    if (window.state !== InGameWindowState.CLOSED) {
      window.state = window.state === InGameWindowState.OPENING ? InGameWindowState.CLOSED : InGameWindowState.CLOSING;
    }
  }

  closeAllWindows(): void {
    this.windows.forEach(window => {
      window.lastState = window.state;
      window.state = InGameWindowState.CLOSED;
    });
    this.windows = [];
  }
}
