import {LoadableGraphics} from '../../../../app/scene/generic-scene/graphics/loadable-graphics';
import {CanvasTextureRegion} from '../../../../app/scene/generic-scene/graphics/canvas-texture-region';
import {Coords} from '../../common/entities';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';


export interface GenericGameObject extends LoadableGraphics {
  position: Coords;
  lastPosition: Coords;

  draw(
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    renderData: {x: number, y: number, scale: number, interpolation: number}
  ): void;

  onTick(writer: GenericWriterService): void;
  onPostTick(writer: GenericWriterService): void;
  onLightMapUpdate?(writer: GenericWriterService, interpolatedPosition: Coords): void;
}
