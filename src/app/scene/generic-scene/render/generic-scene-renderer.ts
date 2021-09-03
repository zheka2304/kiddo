import {Rect} from '../../../shared/interfaces/rect';
import {GenericSceneRenderContext} from './generic-scene-render-context';
import {GenericSceneModel} from '../../../../app-engine/scene/generic/models/generic-scene-model';
import {SceneAccessorsService} from '../../../../app-engine/scene/scene-accessors.service';
import {GenericGridField} from '../../../../app-engine/scene/generic/entities/generic-grid-field';
import {LoadableGraphics} from '../graphics/loadable-graphics';
import {GenericWriterService} from '../../../../app-engine/scene/generic/writers/generic-writer.service';
import {GenericReaderService} from '../../../../app-engine/scene/generic/readers/generic-reader.service';
import {InGameWindowService} from '../../../../app-engine/scene/generic/services/in-game-window-service';


export class GenericSceneRenderer {
  private lastBackgroundSize = {
    width: 0,
    height: 0
  };
  private lastSceneUid: string = null;
  private isBackgroundForcedDirty = false;

  private inGameWindowService = new InGameWindowService();

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

      for (const gameObject of sceneModel.gameObjects) {
        await this.loadGraphics(context, gameObject);
      }
    }
  }


  getSceneModel(): GenericSceneModel {
    return this.sceneAccessorsService.reader.sceneModel as GenericSceneModel;
  }

  getReader(): GenericReaderService {
    return this.sceneAccessorsService.reader as GenericReaderService;
  }

  getWriter(): GenericWriterService {
    return this.sceneAccessorsService.writer as GenericWriterService;
  }

  getRenderInterpolationValue(): number {
    return (this.sceneAccessorsService.writer as GenericWriterService).getRenderInterpolationValue();
  }

  getUiInterpolationValue(): number {
    return (this.sceneAccessorsService.writer as GenericWriterService).getUiInterpolationValue();
  }

  private getCellSizeInPixels(viewport: Rect): number {
    const sceneModel = this.getSceneModel();
    const inverseZoom = sceneModel.inverseZoom;
    const cellSize = Math.max(viewport.width, viewport.height) / inverseZoom;
    return sceneModel.pixelPerfect > 0 ? Math.ceil(cellSize / sceneModel.pixelPerfect) * sceneModel.pixelPerfect : cellSize;
  }

  private getField(): GenericGridField {
    return this.getSceneModel().field;
  }


  getBackgroundSize(viewport: Rect): { width: number, height: number } {
    const field = this.getField();
    const cellSize = this.getCellSizeInPixels(viewport);
    return { width: field.width * cellSize, height: field.height * cellSize };
  }

  isBackgroundDirty(viewport: Rect): boolean {
    const backgroundSize = this.getBackgroundSize(viewport);
    const sceneUid = this.getSceneModel()?.sceneUid;
    if (this.isBackgroundForcedDirty ||
      backgroundSize.width !== this.lastBackgroundSize.width ||
      backgroundSize.height !== this.lastBackgroundSize.height ||
      sceneUid !== this.lastSceneUid
    ) {
      this.lastBackgroundSize = backgroundSize;
      this.lastSceneUid = sceneUid;
      this.isBackgroundForcedDirty = false;
      return true;
    } else {
      return false;
    }
  }

  onStaticDraw(context: GenericSceneRenderContext, canvas: CanvasRenderingContext2D, viewport: Rect): void {
    const sceneModel = this.getSceneModel();
    const reader = this.getReader();
    const cellSize = this.getCellSizeInPixels(viewport);

    canvas.fillStyle = 'white';
    canvas.fillRect(0, 0, sceneModel.field.width * cellSize, sceneModel.field.height * cellSize);

    canvas.imageSmoothingEnabled = false;
    for (let x = 0; x < sceneModel.field.width; x++) {
      for (let y = 0; y < sceneModel.field.height; y++) {
        for (const tile of sceneModel.field.grid[x + y * sceneModel.field.width].tiles) {
          if (this.checkGraphicsLoaded(context, tile)) {
            tile.draw(reader, context, canvas, {x: x * cellSize, y: y * cellSize, width: cellSize, height: cellSize});
          } else {
            // if some background components are not loaded for some reason, force redraw on next frame
            this.isBackgroundForcedDirty = true;
          }
        }
      }
    }
  }


  isLightMapEnabled(): boolean {
    return this.getSceneModel().lightMapEnabled;
  }

  getLightMapSize(viewport: Rect): { width: number, height: number } {
    return this.getSceneModel().field;
  }

  onLightMapDraw(
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    size: {width: number, height: number},
    viewport: Rect
  ): void {
    const sceneModel = this.getSceneModel();

    const floatComponentToHex = c => {
      // noinspection TypeScriptValidateJSTypes
      const hex = Math.floor(Math.min(1, Math.max(0, c)) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const lightColorToHex = (color, level) => {
      const [ r, g, b ] = color;
      level /= Math.max(r, g, b);
      return '#' + floatComponentToHex(r * level) + floatComponentToHex(g * level) + floatComponentToHex(b * level);
    };

    (this.sceneAccessorsService.writer as GenericWriterService).doLightMapUpdates(context, this.getRenderInterpolationValue());

    canvas.clearRect(0, 0, size.width, size.height);
    for (let x = 0; x < sceneModel.field.width; x++) {
      for (let y = 0; y < sceneModel.field.height; y++) {
        const cell = sceneModel.field.grid[x + y * sceneModel.field.width];
        canvas.fillStyle = lightColorToHex(cell.light.color, cell.light.level);
        canvas.fillRect(x, y, 1, 1);
      }
    }
  }


  onForegroundDraw(context: GenericSceneRenderContext, canvas: CanvasRenderingContext2D, viewport: Rect): void {
    const sceneModel = this.getSceneModel();
    const reader = this.getReader();
    const renderData = {
      x: -viewport.x,
      y: -viewport.y,
      scale: this.getCellSizeInPixels(viewport),
      interpolation: this.getRenderInterpolationValue()
    };

    canvas.imageSmoothingEnabled = false;
    for (const gameObject of sceneModel.gameObjects) {
      if (this.checkGraphicsLoaded(context, gameObject)) {
        gameObject.draw(reader, context, canvas, renderData);
      }
    }
  }

  getViewport(context: GenericSceneRenderContext, canvasWidth: number, canvasHeight: number): Rect {
    const defaultViewport = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    const player = this.getSceneModel()?.player;
    if (player) {
      const position = context.getInterpolatedPosition(player.lastPosition, player.position, this.getRenderInterpolationValue());
      position.x += 0.5;
      position.y += 0.5;
      const backgroundSize = this.getBackgroundSize(defaultViewport);
      const cellSize = this.getCellSizeInPixels(defaultViewport);
      position.x = Math.max(0, Math.min(backgroundSize.width - canvasWidth, position.x * cellSize - canvasWidth / 2));
      position.y = Math.max(0, Math.min(backgroundSize.height - canvasHeight, position.y * cellSize - canvasHeight / 2));

      // calculate and correct drag
      const drag = context.getDraggedViewOffset();
      const dragged = {
        x: Math.round(Math.max(0, Math.min(backgroundSize.width - canvasWidth, position.x + drag.x))),
        y: Math.round(Math.max(0, Math.min(backgroundSize.height - canvasHeight, position.y + drag.y)))
      };
      context.setDraggedViewOffset(dragged.x - position.x, dragged.y - position.y);

      return {
        x: dragged.x,
        y: dragged.y,
        width: canvasWidth,
        height: canvasHeight
      };
    } else {
      return defaultViewport;
    }
  }

  onOutputResize(context: GenericSceneRenderContext, width: number, height: number): void {

  }


  private drawPlayerInventory(context: GenericSceneRenderContext, canvas: CanvasRenderingContext2D, viewport: Rect): void {
    const padding = 5;
    const scene = this.getSceneModel();
    let unitSize = Math.min(108, Math.min(viewport.width, viewport.height) * 0.2) - padding * 2;
    if (scene && scene.pixelPerfect) {
      unitSize = Math.floor(unitSize / scene.pixelPerfect) * scene.pixelPerfect;
    }
    if (unitSize < 1) {
      return;
    }

    const boundingRect = {
      x: Math.round(unitSize * 0.1),
      y: viewport.height - Math.round(unitSize * 0.1) - (unitSize + padding * 2),
      width: viewport.width - Math.round(unitSize * 0.1) * 2,
      height: unitSize + padding * 2
    };
    canvas.lineWidth = padding;
    canvas.strokeStyle = 'white';
    canvas.fillStyle = '#1e1e1e';
    canvas.fillRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
    canvas.strokeRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
    canvas.fillStyle = 'white';
    canvas.textAlign = 'start';
    canvas.font = `${padding * 3}px generic-scene-font`;
    canvas.fillText('Inventory:', boundingRect.x, boundingRect.y - padding * 1.5);

    const inventoryRect = {
      x: boundingRect.x + padding,
      y: boundingRect.y + padding,
      width: boundingRect.width - padding * 2,
      height: boundingRect.height - padding * 2
    };
    const inventory = scene.player.inventory;
    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i];
      if ((i + 1) * unitSize + padding * i > inventoryRect.width) {
        break;
      }
      item.draw(this.getReader(), context, canvas, {
        x: inventoryRect.x + i * (unitSize + padding),
        y: inventoryRect.y,
        scale: unitSize,
        interpolation: 1
      });
    }
  }

  onDrawUi(context: GenericSceneRenderContext, canvas: CanvasRenderingContext2D, viewport: Rect): void {
    canvas.imageSmoothingEnabled = false;
    // draw inventory
    const player = this.getReader().getPlayer();
    if (player && player.inventory.length > 0) {
      this.drawPlayerInventory(context, canvas, viewport);
    }
    // draw in-game windows
    this.inGameWindowService.drawWindows(
      context,
      canvas,
      { width: viewport.width, height: viewport.height, interpolation: this.getUiInterpolationValue() }
    );
  }

}
