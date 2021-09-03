import {Coords, Direction} from '../../common/entities';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {CharacterSkin, CharacterSkinRegistryService} from '../services/character-skin-registry.service';
import {DefaultTags} from '../entities/default-tags.enum';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GameObjectBase} from './game-object-base';
import {LightSourceParams} from '../helpers/lighting-helper.service';
import {GenericGameObject} from '../entities/generic-game-object';
import {GenericItemGameObject} from '../entities/generic-item';


export enum CharacterActionType {
  READ = 'read',
  INTERACT = 'interact',
  ITEM = 'item',
}

export class CharacterBase extends GameObjectBase {
  public state: string = null;
  public inventory: GenericItemGameObject[] = [];

  private thisTurnActions: ({ position: Coords, action: CharacterActionType })[] = [];

  private readonly skinRegistryService: CharacterSkinRegistryService = new CharacterSkinRegistryService();
  private idleTexture: DrawableCollection;
  private walkingTexture: DrawableCollection;
  private actionTexture: DrawableCollection;

  constructor(
    position: Coords,
    public direction: Direction,
    protected characterSkin: CharacterSkin | string
  ) {
    super(position);
    this.addImmutableTag(DefaultTags.CHARACTER);
  }


  async onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    const skin = this.skinRegistryService.getCharacterSkin(this.characterSkin);
    this.idleTexture = await context.getTextureLoader().getTextureCollectionFromAtlas(
      this.skinRegistryService.getIdleTextureDescription(skin)
    );
    this.walkingTexture = await context.getTextureLoader().getTextureCollectionFromAtlas(
      this.skinRegistryService.getWalkingTextureDescription(skin)
    );

    this.actionTexture = await context.getTextureLoader().getTextureCollectionFromAtlas({
      atlas: {src: 'assets:/character-action-atlas.png', width: 4, height: 4},
      items: {
        [CharacterActionType.READ]: [[0, 0]],
        [CharacterActionType.INTERACT]: [[1, 0]],
        [CharacterActionType.ITEM]: [[0, 1]],
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
    texture.draw(canvas, this.state || this.direction, targetRect);

    for (const action of this.thisTurnActions) {
      const rect = context.renderDataAndPositionToRect(action.position, action.position, renderData);
      this.actionTexture.draw(canvas, action.action, rect);
    }
  }


  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
    this.thisTurnActions = [];

    // tick items in inventory
    for (const item of this.inventory) {
      if (item.onInventoryTick) {
        item.onInventoryTick(writer, this);
      }
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

  getLightSources(): LightSourceParams[] {
    return [];
  }


  addAction(position: Coords, action: CharacterActionType): void {
    this.thisTurnActions.push({ position, action });
  }

  addActionRelative(offset: Coords, action: CharacterActionType): void {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    this.addAction(position, action);
  }


  pickItem(writer: GenericWriterService, position: Coords, tags: string[], showAction?: boolean): GenericItemGameObject {
    // show action, if required
    if (showAction) {
      this.addAction(position, CharacterActionType.ITEM);
    }
    // find game object on the field by position and tags
    const item = writer.getReader().getGameObjectsAt(position.x, position.y).find((object: GenericItemGameObject) => {
      const itemTags = object.getTags();
      if (itemTags.has(DefaultTags.ITEM)) {
        for (const tag of tags) {
          if (!itemTags.has(tag)) {
            return false;
          }
        }
        return true;
      } else {
        return false;
      }
    }) as GenericItemGameObject;
    // if found, remove from world and add to inventory
    if (item) {
      // check, if item can be picked
      if (item.canBePicked && !item.canBePicked(writer.getReader(), this, position)) {
        return null;
      }
      // pick item
      this.addItemToInventory(item);
      writer.removeGameObject(item);
      item.position = { x: 0, y: 0 };
      item.lastPosition = { x: 0, y: 0 };
      if (item.onPicked) {
        item.onPicked(writer, this, position);
      }
    }
    return item;
  }

  pickItemRelative(writer: GenericWriterService, offset: Coords, tags: string[], showAction?: boolean): GenericItemGameObject {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    return this.pickItem(writer, position, tags, showAction);
  }

  placeItem(writer: GenericWriterService, position: Coords, item: GenericItemGameObject, showAction?: boolean): boolean {
    // show action, if required
    if (showAction) {
      this.addAction(position, CharacterActionType.ITEM);
    }
    // if item is null, return
    if (!item) {
      return false;
    }
    // deny placing items outside of the map
    if (!writer.getReader().getCellAt(position.x, position.y)) {
      return false;
    }
    // check, if item can be placed
    if (item.canBePlaced && !item.canBePlaced(writer.getReader(), this, position)) {
      return false;
    }
    // remove from inventory and add to world
    if (this.removeItemFromInventory(item)) {
      item.position = { ...position };
      item.lastPosition = { ...position };
      writer.addGameObject(item);
      if (item.onPlaced) {
        item.onPlaced(writer, this, position);
      }
      return true;
    } else {
      return false;
    }
  }

  placeItemRelative(writer: GenericWriterService, offset: Coords, item: GenericItemGameObject, showAction?: boolean): boolean {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    return this.placeItem(writer, position, item, showAction);
  }

  addItemToInventory(item: GenericItemGameObject): boolean {
    if (this.inventory.indexOf(item) === -1) {
      this.inventory.push(item);
      return true;
    } else {
      return false;
    }
  }

  removeItemFromInventory(item: GenericItemGameObject): boolean {
    const index = this.inventory.indexOf(item);
    if (index !== -1) {
      this.inventory.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  findItemsInInventory(tags: string[]): GenericItemGameObject[] {
    return this.inventory.filter(item => {
      const itemTags = item.getTags();
      for (const tag of tags) {
        if (!itemTags.has(tag)) {
          return false;
        }
      }
      return true;
    });
  }
}
