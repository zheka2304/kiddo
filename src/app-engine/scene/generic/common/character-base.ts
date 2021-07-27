import {Coords, Direction} from '../../common/entities';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {CharacterSkin, CharacterSkinRegistryService} from '../services/character-skin-registry.service';
import {DefaultTags} from '../entities/default-tags.enum';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GameObjectBase} from './game-object-base';
import {LightSourceParams} from '../helpers/lighting-helper.service';


export enum CharacterActionType {
  READ = 'read',
  INTERACT = 'interact',
}

export class CharacterBase extends GameObjectBase {
  public state: string = null;

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
}
