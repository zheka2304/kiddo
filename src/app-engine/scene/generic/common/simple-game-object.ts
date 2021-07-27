import {TextureAtlasItemCollection} from '../../../../app/scene/generic-scene/graphics/scene-texture-loader.service';
import {GameObjectBase} from './game-object-base';
import {Coords} from '../../common/entities';
import {DefaultTileStates} from '../entities/default-tile-states.enum';
import {SimpleGridTileAdditionalParameters, SimpleGridTileDefinition} from './simple-grid-tile';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {Rect} from '../../../../app/shared/interfaces/rect';


export interface SimpleGameObjectDefinition {
  texture: TextureAtlasItemCollection;
  initialState?: string;
  mutableTags?: string[];
  immutableTags?: string[];
}


export class SimpleGameObject extends GameObjectBase {
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
}
