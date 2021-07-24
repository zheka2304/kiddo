import {SceneBuilder} from '../common/scene-builder';
import {Singleton} from '../../singleton.decorator';
import {SceneDescriptor} from '../common/scene-descriptor';
import {SceneConfig} from '../common/scene-config';
import {GenericReaderService} from './readers/generic-reader.service';
import {GenericWriterService} from './writers/generic-writer.service';
import {GenericSkulptService} from './generic-skulpt.service';
import {SceneType} from '../common/models/scene-type.enum';
import {GenericSceneModel} from './models/generic-scene-model';
import {GenericGridCell, GenericGridField} from './entities/generic-grid-field';
import {GenericGridTile} from './entities/generic-grid-tile';
import {CanvasTextureRegion} from '../../../app/scene/generic-scene/graphics/canvas-texture-region';
import {GenericSceneRenderContext} from '../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericPlayer} from './common/player';


class TestGridTile implements GenericGridTile {
  isGraphicsInitialized = false;

  private texture: CanvasTextureRegion;

  constructor(
    private src: string,
    private atlasX: number,
    private atlasY: number,
    private atlasW: number,
    private atlasH: number
  ) {
  }

  getTileGraphics(): CanvasTextureRegion {
    return this.texture;
  }

  async onGraphicsInit(context: GenericSceneRenderContext): Promise<void> {
    this.texture = await context.getTextureLoader().getTextureAtlasItem(this.src, this.atlasX, this.atlasY, this.atlasW, this.atlasH);
  }

  onTick(writer: GenericWriterService): void {
  }
}


@Singleton
export class GenericBuilderService implements SceneBuilder {
  constructor(
    private reader: GenericReaderService,
    private writer: GenericWriterService,
    private skulptService: GenericSkulptService
  ) {
  }

  buildScene(config: SceneConfig): SceneDescriptor {
    const field: GenericGridField = {
      grid: [],
      width: 20,
      height: 20
    };

    for (let x = 0; x < field.width; x++) {
      for (let y = 0; y < field.height; y++) {
        field.grid.push({
          tiles: [new TestGridTile('assets:/sample-atlas.png', (x + y) % 2, Math.floor(x / 2 + y / 2) % 2, 2, 2)],
          lightLevel: 0
        });
      }
    }


    const sceneModel: GenericSceneModel = {
      sceneType: SceneType.GENERIC,
      checkingLogic: () => null,

      field,
      gameObjects: [],
      player: null,
      inverseZoom: 8
    };

    const player = new GenericPlayer();
    sceneModel.gameObjects.push(player);
    sceneModel.player = player;

    return {
      model: sceneModel,
      reader: this.reader,
      writer: this.writer,
      skulptService: this.skulptService,
    };
  }
}
