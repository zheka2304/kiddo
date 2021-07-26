import {LoadableGraphics} from '../../../../app/scene/generic-scene/graphics/loadable-graphics';
import {Coords} from '../../common/entities';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {Taggable} from './taggable';


export interface GenericGameObject extends LoadableGraphics, Taggable {
  position: Coords;
  lastPosition: Coords;

  draw(
    reader: GenericReaderService,
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    renderData: {x: number, y: number, scale: number, interpolation: number}
  ): void;

  onTick(writer: GenericWriterService): void;
  onPostTick(writer: GenericWriterService): void;
  onLightMapUpdate?(writer: GenericWriterService, interpolatedPosition: Coords): void;
  onGameEnd?(reader: GenericReaderService): void;
  onInteract?(writer: GenericWriterService, interactingObject: GenericGameObject): boolean;
}
