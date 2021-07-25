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
import {GenericPlayer} from './common/player';
import {CommonTileRegistryService} from './common-tile-registry.service';


declare type TileOrDescription = string | GenericGridTile;

@Singleton
export class GenericBuilderService implements SceneBuilder {
  constructor(
    private reader: GenericReaderService,
    private writer: GenericWriterService,
    private commonTileRegistryService: CommonTileRegistryService,
    private skulptService: GenericSkulptService,
  ) {
  }

  private parseFieldFromArray(data: (TileOrDescription|TileOrDescription[])[][]): GenericGridField {
    const field: GenericGridField = {
      grid: [],
      width: data[0].length,
      height: data.length,
    };

    for (let y = 0; y < field.height; y++) {
      for (let x = 0; x < field.width; x++) {
        const cell: GenericGridCell = {
          tiles: [],
          lightLevel: 0,
          lightColor: '#000000'
        };
        field.grid.push(cell);

        const cellDescOrArray = data[y][x];
        const cellDescriptionArray = Array.isArray(cellDescOrArray) ? cellDescOrArray : [ cellDescOrArray as TileOrDescription ];
        for (const tileDescription of cellDescriptionArray) {
          if (typeof(tileDescription) === 'string') {
            for (const tile of this.commonTileRegistryService.parseTileArray(tileDescription, { x, y })) {
              if (tile) {
                cell.tiles.push(tile);
              }
            }
          } else {
            const tile = tileDescription as GenericGridTile;
            tile.position = { x, y };
            cell.tiles.push(tile);
          }
        }
      }
    }

    return field;
  }

  buildScene(config: SceneConfig): SceneDescriptor {
    const field: GenericGridField = this.parseFieldFromArray([
      ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass;goal-flag', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
      ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ]);

    const sceneModel: GenericSceneModel = {
      sceneType: SceneType.GENERIC,
      checkingLogic: () => null,

      field,
      gameObjects: [],
      player: null,
      inverseZoom: 8
    };

    const player = new GenericPlayer({x: 1, y: 1});
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
