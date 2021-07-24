import {LoadableGraphics} from '../../../../app/scene/generic-scene/graphics/loadable-graphics';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Drawable} from '../../../../app/scene/generic-scene/graphics/drawable';


export interface GenericGridTile extends LoadableGraphics {
  getTileGraphics(): Drawable;

  onTick(writer: GenericWriterService): void;
}
