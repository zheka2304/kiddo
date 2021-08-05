import {TextureAtlasItemCollection} from '../../../../app/scene/generic-scene/graphics/scene-texture-loader.service';
import {GameObjectBase} from './game-object-base';
import {Coords} from '../../common/entities';
import {DefaultTileStates} from '../entities/default-tile-states.enum';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {LightSourceParams} from '../helpers/lighting-helper.service';
import {GenericWriterService} from '../writers/generic-writer.service';
import {DefaultTags} from '../entities/default-tags.enum';
import {GenericItem} from '../entities/generic-item';
import {GenericGameObject} from '../entities/generic-game-object';


export interface SimpleGameObjectDefinition {
  texture: TextureAtlasItemCollection;
  lightSources?: LightSourceParams[];
  initialState?: string;
  mutableTags?: string[];
  immutableTags?: string[];

  item?: {
    name?: string;
    ignoreObstacle?: boolean;
  };
}


export class SimpleGameObject extends GameObjectBase implements GenericItem {
  public state: string = null;

  private texture: DrawableCollection = null;


  constructor(
    position: Coords,
    private definition: SimpleGameObjectDefinition,
  ) {
    super(position);

    // parse definition
    this.state = definition.initialState || DefaultTileStates.MAIN;
    if (definition.immutableTags) {
      for (const tag of definition.immutableTags) {
        this.addImmutableTag(tag);
      }
    }
    if (definition.mutableTags) {
      for (const tag of definition.mutableTags) {
        this.addTag(tag);
      }
    }

    if (definition.item) {
      this.addImmutableTag(DefaultTags.ITEM);
    }
  }


  async onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    this.texture = await context.getTextureLoader().getTextureCollectionFromAtlas(this.definition.texture);
  }

  draw(
    reader: GenericReaderService,
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    renderData: { x: number; y: number; scale: number; interpolation: number }
  ): void {
    if (this.texture) {
      this.texture.draw(canvas, this.state, context.renderDataAndPositionToRect(this.lastPosition, this.position, renderData));
    }
  }

  onLightMapUpdate(writer: GenericWriterService, interpolatedPosition: Coords): void {
    if (this.definition.lightSources) {
      for (const lightSource of this.definition.lightSources) {
        this.lightingHelper.lightAround(writer.getReader(), this.position, interpolatedPosition, lightSource);
      }
    }
  }


  getItemName(): string {
    return this.definition?.item?.name || 'item';
  }

  canBePlaced(reader: GenericReaderService, character: GenericGameObject, position: Coords): boolean {
    return this.definition?.item?.ignoreObstacle || !reader.getAllTagsAt(position.x, position.y).has(DefaultTags.OBSTACLE);
  }
}
