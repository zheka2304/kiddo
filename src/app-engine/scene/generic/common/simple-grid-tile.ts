import {GridTileBase} from './grid-tile-base';
import {Coords} from '../../common/entities';
import {TextureAtlasItemCollection} from '../../../../app/scene/generic-scene/graphics/scene-texture-loader.service';
import {DrawableCollection} from '../../../../app/scene/generic-scene/graphics/drawable-collection';
import {DefaultTileStates} from '../entities/default-tile-states.enum';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {Rect} from '../../../../app/shared/interfaces/rect';
import {GenericGridCell} from '../entities/generic-grid-field';


export interface SimpleGridTileDefinition {
  texture?: TextureAtlasItemCollection;
  ctCheckConnected?: (cell: GenericGridCell) => boolean;

  initialState?: string;
  mutableTags?: string[];
  immutableTags?: string[];
}

export interface SimpleGridTileAdditionalParameters {
  offset?: number[];
  addTags?: string[];
  removeTags?: string[];
}


export class SimpleGridTile extends GridTileBase {
  public state: string = null;

  private texture: DrawableCollection = null;

  constructor(
    private definition: SimpleGridTileDefinition,
    private params: SimpleGridTileAdditionalParameters,
    position?: Coords
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

    // parse additional parameters
    if (params) {
      if (params.addTags) {
        for (const tag of params.addTags) {
          this.addTag(tag);
        }
      }
      if (params.removeTags) {
        for (const tag of params.removeTags) {
          this.removeTag(tag);
        }
      }
    }
  }

  async onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    let texture = this.definition.texture;
    if (texture) {
      if (this.params?.offset) {
        texture = context.getTextureLoader().addOffsetToTextureItemCollection(texture, {
          x: this.params.offset[0],
          y: this.params.offset[1]
        });
      }
      this.texture = await context.getTextureLoader().getTextureCollectionFromAtlas(texture);
    }
  }

  draw(
    reader: GenericReaderService,
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    targetRect: Rect
  ): void {
    if (this.texture != null) {
      this.texture.draw(canvas, this.state, targetRect, {
        reader,
        checkConnected: (cell: GenericGridCell) => {
          if (this.definition.ctCheckConnected) {
            return this.definition.ctCheckConnected(cell);
          }
          return false;
        },
        position: this.position,
      });
    }
  }
}
