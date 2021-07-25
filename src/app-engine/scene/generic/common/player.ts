import {GenericGameObject} from '../entities/generic-game-object';
import {Coords, Direction} from '../../common/entities';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericWriterService} from '../writers/generic-writer.service';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GameObjectBase} from './game-object-base';


export class GenericPlayer extends GameObjectBase {
  direction: Direction = Direction.RIGHT;

  private idleTexture: DrawableCollection;
  private walkingTexture: DrawableCollection;

  constructor(position: Coords) {
    super(position);
    this.addImmutableTag('player');
  }

  async onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    this.idleTexture = await context.getTextureLoader().getTextureCollectionFromAtlas({
      atlas: {src: 'assets:/sample-player-atlas.png', width: 10, height: 8},
      items: {
        [Direction.DOWN]: [[0, 0]],
        [Direction.UP]: [[0, 2]],
        [Direction.LEFT]: [[0, 1]],
        [Direction.RIGHT]: [[0, 3]],
      }
    });

    this.walkingTexture = await context.getTextureLoader().getTextureCollectionFromAtlas({
        atlas: {src: 'assets:/sample-player-atlas.png', width: 10, height: 8},
        items: {
          [Direction.DOWN]: [[0, 9, 4, 4]],
          [Direction.UP]: [[0, 9, 6, 6]],
          [Direction.LEFT]: [[0, 9, 5, 5]],
          [Direction.RIGHT]: [[0, 9, 7, 7]],
        },
        fps: 12
      });
  }

  draw(
    reader: GenericReaderService,
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    renderData: { x: number; y: number; scale: number, interpolation: number }
  ): void {
    const targetRect = context.renderDataAndPositionToRect(this.lastPosition, this.position, renderData);
    const texture = (this.lastPosition.x === this.position.x && this.lastPosition.y === this.position.y ?
                        this.idleTexture : this.walkingTexture);
    texture.draw(canvas, this.direction, targetRect);
  }

  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
  }

  onLightMapUpdate(writer: GenericWriterService, interpolatedPosition: Coords): void {
    // update light map
    const reader = writer.getReader();
    const r = 3;
    const r2 = r + 2;
    const field = writer.sceneModel.field;
    const lightFlicker = 1;

    for (let x = -r2; x <= r2; x++) {
      for (let y = -r2; y <= r2; y++) {
        if (y + this.position.y >= 0 && y + this.position.y < field.height) {
          const cell = reader.getCellAt(this.position.x + x, this.position.y + y);
          if (cell) {
            const dx = interpolatedPosition.x - (this.position.x + x);
            const dy = interpolatedPosition.y - (this.position.y + y);
            cell.lightLevel = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / r) * lightFlicker;
          }
        }
      }
    }
  }


  go(): void {
    switch (this.direction) {
      case Direction.UP: {
        this.position.y--;
        break;
      }
      case Direction.DOWN: {
        this.position.y++;
        break;
      }
      case Direction.LEFT: {
        this.position.x--;
        break;
      }
      case Direction.RIGHT: {
        this.position.x++;
        break;
      }
    }
  }

  turn(direction: Direction): void {
    const turns = {
      [Direction.RIGHT]: {
        [Direction.DOWN]: Direction.LEFT,
        [Direction.LEFT]: Direction.UP,
        [Direction.UP]: Direction.RIGHT,
        [Direction.RIGHT]: Direction.DOWN,
      },
      [Direction.LEFT]: {
        [Direction.DOWN]: Direction.RIGHT,
        [Direction.RIGHT]: Direction.UP,
        [Direction.UP]: Direction.LEFT,
        [Direction.LEFT]: Direction.DOWN,
      },
    };
    this.direction = turns[direction][this.direction];
  }
}
