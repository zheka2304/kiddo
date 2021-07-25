import {TaggableBase} from './taggable-base';
import {GenericGridTile} from '../entities/generic-grid-tile';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Drawable} from '../../../../app/scene/generic-scene/graphics/drawable';
import {Coords} from '../../common/entities';
import {Rect} from '../../../../app/shared/interfaces/rect';


export class GridTileBase extends TaggableBase implements GenericGridTile {
  isGraphicsInitialized: boolean;

  constructor(
    public position: Coords
  ) {
    super();
  }

  onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    return Promise.resolve(null);
  }

  draw(
    reader: GenericReaderService,
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    targetRect: Rect
  ): void {
    const graphics = this.getTileGraphics(reader);
    if (graphics != null) {
      graphics.draw(canvas, targetRect);
    }
  }

  getTileGraphics(reader: GenericReaderService): Drawable {
    return null;
  }

  onTick(writer: GenericWriterService): void {
  }
}
