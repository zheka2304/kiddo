import {LoadableGraphics} from '../../../../app/scene/generic-scene/graphics/loadable-graphics';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Drawable} from '../../../../app/scene/generic-scene/graphics/drawable';
import {GenericReaderService} from '../readers/generic-reader.service';
import {Taggable} from './taggable';
import {Coords} from '../../common/entities';


export interface GenericGridTile extends LoadableGraphics, Taggable {
  position: Coords;

  getTileGraphics(reader: GenericReaderService): Drawable;

  onTick(writer: GenericWriterService): void;
}
