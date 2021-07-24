import {Rect} from '../../../shared/interfaces/rect';
import {GenericSceneRenderContext} from './generic-scene-render-context';
import {GenericSceneModel} from '../../../../app-engine/scene/generic/models/generic-scene-model';
import {SceneAccessorsService} from '../../../../app-engine/scene/scene-accessors.service';
import {GenericGridField} from '../../../../app-engine/scene/generic/entities/generic-grid-field';
import {LoadableGraphics} from '../graphics/loadable-graphics';
import {GenericWriterService} from "../../../../app-engine/scene/generic/writers/generic-writer.service";


export class GenericSceneRenderer {
  private lastBackgroundSize = {
    width: 0,
    height: 0
  };
  private isBackgroundForcedDirty = false;

  constructor(
    private sceneAccessorsService: SceneAccessorsService
  ) {
  }

  private loadGraphics(context: GenericSceneRenderContext, o: LoadableGraphics): Promise<LoadableGraphics> {
    if (!o.isGraphicsInitialized) {
      return o.onGraphicsInit(context).then(() => {
        o.isGraphicsInitialized = true;
        return o;
      });
    } else {
      return Promise.resolve(o);
    }
  }

  private checkGraphicsLoaded(context: GenericSceneRenderContext, o: LoadableGraphics): boolean {
    if (!o.isGraphicsInitialized) {
      this.loadGraphics(context, o).then(() => {});
      return false;
    } else {
      return true;
    }
  }

  async onInit(context: GenericSceneRenderContext): Promise<void> {
    const sceneModel = this.getSceneModel();
    if (sceneModel && sceneModel.field) {
      for (const cell of sceneModel.field.grid) {
        for (const tile of cell.tiles) {
          await this.loadGraphics(context, tile);
        }
      }
    }
  }


  getSceneModel(): GenericSceneModel {
    return this.sceneAccessorsService.reader.sceneModel as GenericSceneModel;
  }

  getRenderInterpolationValue(): number {
    return (this.sceneAccessorsService.writer as GenericWriterService).getRenderInterpolationValue();
  }

  private getCellSizeInPixels(viewport: Rect): number {
    const inverseZoom = this.getSceneModel().inverseZoom;
    return Math.max(viewport.width, viewport.height) / inverseZoom;
  }

  private getField(): GenericGridField {
    return this.getSceneModel().field;
  }


  onStaticDraw(context: GenericSceneRenderContext, canvas: CanvasRenderingContext2D, viewport: Rect): void {
    const sceneModel = this.getSceneModel();
    const cellSize = this.getCellSizeInPixels(viewport);

    canvas.fillStyle = 'white';
    canvas.fillRect(0, 0, sceneModel.field.width * cellSize, sceneModel.field.height * cellSize);

    canvas.imageSmoothingEnabled = false;
    for (let x = 0; x < sceneModel.field.width; x++) {
      for (let y = 0; y < sceneModel.field.height; y++) {
        for (const tile of sceneModel.field.grid[x * sceneModel.field.height + y].tiles) {
          if (this.checkGraphicsLoaded(context, tile)) {
            tile.getTileGraphics().draw(canvas, {x: x * cellSize, y: y * cellSize, width: cellSize, height: cellSize});
          } else {
            // if some background components are not loaded for some reason, force redraw on next frame
            this.isBackgroundForcedDirty = true;
          }
        }
      }
    }
  }

  getBackgroundSize(viewport: Rect): { width: number, height: number } {
    const field = this.getField();
    const cellSize = this.getCellSizeInPixels(viewport);
    return { width: field.width * cellSize, height: field.height * cellSize };
  }

  isBackgroundDirty(viewport: Rect): boolean {
    const backgroundSize = this.getBackgroundSize(viewport);
    if (this.isBackgroundForcedDirty ||
        backgroundSize.width !== this.lastBackgroundSize.width ||
        backgroundSize.height !== this.lastBackgroundSize.height) {
      this.lastBackgroundSize = backgroundSize;
      this.isBackgroundForcedDirty = false;
      return true;
    } else {
      return false;
    }
  }

  onForegroundDraw(context: GenericSceneRenderContext, ctx: CanvasRenderingContext2D, viewport: Rect): void {
    const sceneModel = this.getSceneModel();
    const renderData = {
      x: -viewport.x,
      y: -viewport.y,
      scale: this.getCellSizeInPixels(viewport),
      interpolation: this.getRenderInterpolationValue()
    };

    ctx.imageSmoothingEnabled = false;

    for (const gameObject of sceneModel.gameObjects) {
      if (this.checkGraphicsLoaded(context, gameObject)) {
        gameObject.draw(context, ctx, renderData);
      }
    }
  }

  getViewport(context: GenericSceneRenderContext, canvasWidth: number, canvasHeight: number): Rect {
    const defaultViewport = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    const player = this.getSceneModel()?.player;
    if (player) {
      const position = context.getInterpolatedPosition(player.lastPosition, player.position, this.getRenderInterpolationValue());
      const backgroundSize = this.getBackgroundSize(defaultViewport);
      const cellSize = this.getCellSizeInPixels(defaultViewport);
      return {
        x: Math.max(0, Math.min(backgroundSize.width - canvasWidth, position.x * cellSize - canvasWidth / 2)),
        y: Math.max(0, Math.min(backgroundSize.height - canvasHeight, position.y * cellSize - canvasHeight / 2)),
        width: canvasWidth,
        height: canvasHeight
      };
    } else {
      return defaultViewport;
    }
  }

  onOutputResize(context: GenericSceneRenderContext, width: number, height: number): void {

  }

}