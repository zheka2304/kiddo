import {GenericGameObject} from '../entities/generic-game-object';
import {Coords, Direction} from '../../common/entities';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericWriterService} from '../writers/generic-writer.service';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GameObjectBase} from './game-object-base';
import {DefaultTags} from '../entities/default-tags.enum';
import {LightSourceParams} from '../helpers/lighting-helper.service';
import {CharacterSkin, CharacterSkinRegistryService} from '../services/character-skin-registry.service';


export enum PlayerActionType {
  READ = 'read',
  INTERACT = 'interact',
}

export interface GenericPlayerParameters {
  skin?: string | CharacterSkin;
  defaultLightSources?: LightSourceParams[];

  minVisibleLightLevel?: number;
  interactRange?: number;
  lookRange?: number;
}

export class GenericPlayer extends GameObjectBase {
  direction: Direction = Direction.RIGHT;
  private failReason: string = null;
  private thisTurnActions: ({ position: Coords, action: PlayerActionType })[] = [];

  private idleTexture: DrawableCollection;
  private walkingTexture: DrawableCollection;
  private actionTexture: DrawableCollection;

  private readonly skinRegistryService: CharacterSkinRegistryService = new CharacterSkinRegistryService();

  constructor(
    position: Coords,
    private parameters: GenericPlayerParameters
  ) {
    super(position);
    this.addImmutableTag(DefaultTags.PLAYER);
  }

  async onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    const skin = this.skinRegistryService.getCharacterSkin(this.parameters?.skin);
    this.idleTexture = await context.getTextureLoader().getTextureCollectionFromAtlas(
      this.skinRegistryService.getIdleTextureDescription(skin)
    );
    this.walkingTexture = await context.getTextureLoader().getTextureCollectionFromAtlas(
      this.skinRegistryService.getWalkingTextureDescription(skin)
    );

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
    for (let lightSource of this.getLightSources()) {
      if (lightSource.offset) {
        lightSource = {
          ...lightSource,
          offset: this.navigationHelper.offset({ x: 0, y: 0 }, this.direction, lightSource.offset)
        };
      }
      this.lightingHelper.lightAround(writer.getReader(), this.position, interpolatedPosition, lightSource);
    }
  }


  getFailReason(): string {
    return this.failReason;
  }

  getMinVisibleLightLevel(reader: GenericReaderService): number {
    return this.parameters?.minVisibleLightLevel || 0;
  }

  validateInspectOffset(offset: Coords): boolean {
    const range = this.parameters?.lookRange;
    return range ? (Math.abs(offset.x) <= range && Math.abs(offset.y) <= range) : true;
  }

  validateInteractOffset(offset: Coords): boolean {
    const range = this.parameters?.interactRange || 1;
    return (Math.abs(offset.x) <= range && Math.abs(offset.y) <= range);
  }

  validateLookRange(range: number): boolean {
    const lookRange = this.parameters?.lookRange;
    return lookRange ? range <= lookRange : true;
  }

  getLightSources(): LightSourceParams[] {
    return this.parameters?.defaultLightSources || [];
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

  getAllTagsRelativeToPlayer(
    reader: GenericReaderService,
    offset: Coords,
    exclude?: GenericGameObject[],
    showAction?: boolean
  ): Set<string> {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    if (showAction) {
      this.addAction(position, PlayerActionType.READ);
    }
    return reader.getAllTagsAt(position.x, position.y, exclude, this.getMinVisibleLightLevel(reader));
  }

  lookForCellsWithTag(
    reader: GenericReaderService,
    tag: string,
    range: number,
    showAction?: boolean
  ): Coords[] {
    const result: Coords[] = [];
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        const tags = reader.getAllTagsAt(this.position.x + x, this.position.y + y, [], this.getMinVisibleLightLevel(reader));
        if (tags.has(tag)) {
          result.push({ x, y });
          if (showAction) {
            this.addAction({ x: this.position.x + x, y: this.position.y + y }, PlayerActionType.READ);
          }
        }
      }
    }
    return result;
  }

  interact(
    writer: GenericWriterService,
    offset: Coords,
    exclude?: GenericGameObject[],
    showAction?: boolean
  ): GenericGameObject {
    const reader = writer.getReader();
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    if (showAction) {
      this.addAction(position, PlayerActionType.INTERACT);
    }
    if (reader.getLightLevelAt(position.x, position.y) >= this.getMinVisibleLightLevel(reader)) {
      return writer.interact(position.x, position.y, this, exclude);
    }
    return null;
  }

  addAction(position: Coords, action: PlayerActionType): void {
    this.thisTurnActions.push({ position, action });
  }

  addActionRelative(offset: Coords, action: PlayerActionType): void {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    this.addAction(position, action);
  }
}
