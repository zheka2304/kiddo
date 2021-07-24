import {TaggableBase} from './taggable-base';
import {GenericGridTile} from '../entities/generic-grid-tile';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Drawable} from '../../../../app/scene/generic-scene/graphics/drawable';
import {Coords} from '../../common/entities';


export class GridTileBase extends TaggableBase implements GenericGridTile {
  position: Coords;
  isGraphicsInitialized: boolean;

  onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    return Promise.resolve(null);
  }

  getTileGraphics(reader: GenericReaderService): Drawable {
    return null;
  }

  onTick(writer: GenericWriterService): void {
  }
}
