import {LoadableGraphics} from '../../../../app/scene/generic-scene/graphics/loadable-graphics';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Drawable} from '../../../../app/scene/generic-scene/graphics/drawable';
import {GenericReaderService} from '../readers/generic-reader.service';
import {Taggable} from './taggable';
import {Coords} from '../../common/entities';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {Rect} from '../../../../app/shared/interfaces/rect';


export interface GenericGridTile extends LoadableGraphics, Taggable {
  position: Coords;

  draw(
    reader: GenericReaderService,
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    targetRect: Rect
  ): void;

  onTick(writer: GenericWriterService): void;
}
