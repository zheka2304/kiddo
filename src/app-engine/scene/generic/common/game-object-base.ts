import {GenericGameObject} from '../entities/generic-game-object';
import {Coords} from '../../common/entities';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericWriterService} from '../writers/generic-writer.service';
import {TaggableBase} from './taggable-base';


export class GameObjectBase extends TaggableBase implements GenericGameObject {
  isGraphicsInitialized: boolean;
  lastPosition: Coords;
  position: Coords;

  draw(
    reader: GenericReaderService,
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    renderData: { x: number; y: number; scale: number; interpolation: number }
  ): void {
  }

  constructor(position: Coords) {
    super();
    this.position = { ...position };
    this.lastPosition = { ...position };
  }

  onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    return Promise.resolve(undefined);
  }

  onPostTick(writer: GenericWriterService): void {
  }

  onTick(writer: GenericWriterService): void {
    this.lastPosition = { ...this.position };
  }
}
