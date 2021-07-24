import {LoadableGraphics} from '../../../../app/scene/generic-scene/graphics/loadable-graphics';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Drawable} from '../../../../app/scene/generic-scene/graphics/drawable';
import {GenericReaderService} from '../readers/generic-reader.service';


export interface GenericGridTile extends LoadableGraphics {
  getTileGraphics(reader: GenericReaderService): Drawable;

  onTick(writer: GenericWriterService): void;
}
