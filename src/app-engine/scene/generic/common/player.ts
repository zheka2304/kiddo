import {GenericGameObject} from '../entities/generic-game-object';
import {Coords, Direction} from '../../common/entities';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericWriterService} from '../writers/generic-writer.service';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GameObjectBase} from './game-object-base';
import {DefaultTags} from '../entities/default-tags.enum';


export enum PlayerActionType {
  READ = 'read',
  INTERACT = 'interact',
}

export class GenericPlayer extends GameObjectBase {
  direction: Direction = Direction.RIGHT;
  private failReason: string = null;
  private thisTurnActions: ({ position: Coords, action: PlayerActionType })[] = [];

  private idleTexture: DrawableCollection;
  private walkingTexture: DrawableCollection;
  private actionTexture: DrawableCollection;

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

    this.actionTexture = await context.getTextureLoader().getTextureCollectionFromAtlas({
      atlas: {src: 'assets:/player-action-atlas.png', width: 4, height: 4},
      items: {
        [PlayerActionType.READ]: [[0, 0]],
        [PlayerActionType.INTERACT]: [[1, 0]],
      }
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

    for (const action of this.thisTurnActions) {
      const rect = context.renderDataAndPositionToRect(action.position, action.position, renderData);
      this.actionTexture.draw(canvas, action.action, rect);
    }
  }

  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
    this.thisTurnActions = [];
  }

  onPostTick(writer: GenericWriterService): void {
    super.onPostTick(writer);
    this.checkForHazards(writer.getReader());
  }

  protected checkForHazards(reader: GenericReaderService): void {
    const tags = reader.getAllTagsAt(this.position.x, this.position.y, [ this ]);
    if (tags.has(DefaultTags.DEADLY)) {
      this.failReason = 'DESTROYED';
      if (tags.has(DefaultTags.MONSTER)) {
        this.failReason = 'CAUGHT_BY_MONSTER';
      }
    } else if (tags.has(DefaultTags.OBSTACLE)) {
      this.failReason = 'IN_OBSTACLE';
    }
  }

  onLightMapUpdate(writer: GenericWriterService, interpolatedPosition: Coords): void {
    this.lightingHelper.lightAround(writer.getReader(), this.position, interpolatedPosition, { radius: 3, brightness: 1 });
    /* this.lightingHelper.lightAround(writer.getReader(), this.position, interpolatedPosition, { radius: 1, brightness: 1 });
    this.lightingHelper.lightAround(writer.getReader(), this.position, interpolatedPosition, {
      radius: 1, brightness: 1,
      offset: this.navigationHelper.offset({x: 0, y: 0}, this.direction)
    }); */
  }


  getFailReason(): string {
    return this.failReason;
  }

  getMinVisibleLightLevel(reader: GenericReaderService): number {
    return 0.1;
  }


  go(reader: GenericReaderService): boolean {
    const position = this.navigationHelper.offset(this.position, this.direction, { x: 0, y: 1 });
    if (
      reader.isPositionOnField(position.x, position.y) &&
      !reader.getAllTagsAt(position.x, position.y, [this]).has(DefaultTags.OBSTACLE)
    ) {
      this.position = position;
      return true;
    } else {
      return false;
    }
  }

  turn(reader: GenericReaderService, rotate: Direction): void {
    this.direction = this.navigationHelper.rotate(this.direction, rotate);
  }

  getAllTagsRelativeToPlayer(reader: GenericReaderService, offset: Coords, exclude?: GenericGameObject[]): Set<string> {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    this.addAction(position, PlayerActionType.READ);
    return reader.getAllTagsAt(position.x, position.y, exclude, this.getMinVisibleLightLevel(reader));
  }

  addAction(position: Coords, action: PlayerActionType): void {
    this.thisTurnActions.push({ position, action });
  }

  addActionRelative(offset: Coords, action: PlayerActionType): void {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    this.addAction(position, action);
  }
}
