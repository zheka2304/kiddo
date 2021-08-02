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
import {CommonTileRegistryService} from './services/common-tile-registry.service';
import {GridTileBase} from './common/grid-tile-base';
import {GameObjectBase} from './common/game-object-base';
import {TaggableBase} from './common/taggable-base';
import {CheckingLogic, Coords} from '../common/entities';
import {GenericGameObject} from './entities/generic-game-object';
import {SceneConfigError} from '../common/errors/game-fail-error';
import {DefaultTags} from './entities/default-tags.enum';
import {DefaultTileStates} from './entities/default-tile-states.enum';
import {InGameConsoleService} from './services/in-game-console.service';
import {CharacterSkinRegistryService} from './services/character-skin-registry.service';
import {ConsoleTerminalGameObject} from './common/console-terminal-game-object';
import {SimpleGameObject} from './common/simple-game-object';
import {SimpleGridTile} from './common/simple-grid-tile';
import {CharacterBase} from './common/character-base';
import {TaskRegistryService} from './services/task-registry.service';


declare type TileOrDescription = string | GenericGridTile;
declare type FieldTilesDescription = (TileOrDescription|TileOrDescription[])[][];
declare type FieldTilesDescriptionOrSize = FieldTilesDescription | { width: number, height: number };


export interface GenericSceneAdditionalParameters {
  lightMap?: {
    enabled?: boolean,
    ambient?: number,
    ambientColor?: number[]
  };

  // more readable inverse zoom alias
  tilesPerScreen?: number;

  pixelPerfect?: number;
}


@Singleton
export class GenericBuilderService implements SceneBuilder {
  private taskRegistryService = new TaskRegistryService();
  private commonTileRegistryService = new CommonTileRegistryService();
  private characterSkinRegistryService = new CharacterSkinRegistryService();
  private inGameConsoleService = new InGameConsoleService();

  constructor(
    private reader: GenericReaderService,
    private writer: GenericWriterService,
    private skulptService: GenericSkulptService,
  ) {
  }
  private sceneModel: GenericSceneModel = null;


  buildScene(config: SceneConfig): SceneDescriptor {
    this.sceneModel = {
      sceneUid: Date.now().toString(16),

      sceneType: SceneType.GENERIC,
      checkingLogic: () => null,

      field: null,
      gameObjects: [],
      player: null,

      lightMapEnabled: false,
      inverseZoom: 6
    };

    const evaluateInScope = (context: { [key: string]: any }, expr: string): any => {
      const evaluator = Function.apply(null, [...Object.keys(context), 'expr', 'return eval(expr)']);
      return evaluator.apply(null, [...Object.values(context), expr]);
    };

    const initializerFunc = this.taskRegistryService.parseTaskInitializerFunc(config.generatingFunc, {
      // scene builder
      Builder: this,

      // services
      TileRegistry: this.commonTileRegistryService,
      CharacterSkinRegistry: this.characterSkinRegistryService,
      InGameConsole: this.inGameConsoleService,

      // classes
      TaggableBase,
      GridTileBase,
      GameObjectBase,
      GenericPlayer,
      ConsoleTerminalGameObject,
      SimpleGridTile,
      SimpleGameObject,
      CharacterBase,

      // helpful defaults
      DefaultTags,
      DefaultTileStates,

      // inline defaults
      DefaultCheckingLogic: {
        GOAL_REACHED: (reader: GenericReaderService) => {
          if (reader.getPlayer().getAllTagsRelativeToPlayer(reader, { x: 0, y: 0 }).has(DefaultTags.GOAL)) {
            return null;
          }
          return 'FINISH_NOT_REACHED';
        }
      },

      DefaultCTLogic: {
        HAS_TAGS: (tags: string[], connectOutsides: boolean = true) => {
          return (cell: GenericGridCell) => {
            if (!cell) {
              return connectOutsides;
            }
            const allTags = new Set<string>();
            for (const tile of cell.tiles) {
              tile.getTags().forEach(tag => allTags.add(tag));
            }
            return tags.reduce((prev, tag) => prev && allTags.has(tag), true);
          };
        },
        NO_TAGS: (tags: string[], connectOutsides: boolean = true) => {
          return (cell: GenericGridCell) => {
            if (!cell) {
              return connectOutsides;
            }
            const allTags = new Set<string>();
            for (const tile of cell.tiles) {
              tile.getTags().forEach(tag => allTags.add(tag));
            }
            return tags.reduce((prev, tag) => prev && !allTags.has(tag), true);
          };
        },
        ANY_TAGS: (tags: string[], connectOutsides: boolean = true) => {
          return (cell: GenericGridCell) => {
            if (!cell) {
              return connectOutsides;
            }
            const allTags = new Set<string>();
            for (const tile of cell.tiles) {
              tile.getTags().forEach(tag => allTags.add(tag));
            }
            return tags.reduce((prev, tag) => prev || allTags.has(tag), false);
          };
        }
      }
    });
    initializerFunc();

    this.validateSceneModel();
    return {
      model: this.sceneModel,
      reader: this.reader,
      writer: this.writer,
      skulptService: this.skulptService,
    };
  }

  private validateSceneModel(): void {
    if (!this.sceneModel.field) {
      throw new SceneConfigError('GENERIC.NO_GAME_FIELD');
    }
    if (!this.sceneModel.player) {
      throw new SceneConfigError('GENERIC.NO_PLAYER');
    }
  }


  // builder api

  private parseTileArray(
    position: Coords,
    cellDescOrArray: TileOrDescription | TileOrDescription[],
    abortOnError?: boolean
  ): GenericGridTile[] {
    const tiles: GenericGridTile[] = [];
    const cellDescriptionArray = Array.isArray(cellDescOrArray) ? cellDescOrArray : [ cellDescOrArray as TileOrDescription ];
    for (const tileDescription of cellDescriptionArray) {
      if (typeof(tileDescription) === 'string') {
        for (const tile of this.commonTileRegistryService.parseTileArray(tileDescription, { ...position }, abortOnError)) {
          if (tile) {
            tile.position = { ...position };
            tiles.push(tile);
          }
        }
      } else {
        const tile = tileDescription as GenericGridTile;
        tile.position = { ...position };
        tiles.push(tile);
      }
    }
    return tiles;
  }

  private parseFieldFromArray(
    data: FieldTilesDescription,
    params: GenericSceneAdditionalParameters,
    abortOnError?: boolean
  ): GenericGridField {
    const field: GenericGridField = {
      grid: [],
      width: data[0].length,
      height: data.length,
    };

    const ambientLight = params?.lightMap?.ambient || 0;
    const ambientLightColor = params?.lightMap?.ambientColor || [ 1, 1, 1 ];
    for (let y = 0; y < field.height; y++) {
      for (let x = 0; x < field.width; x++) {
        const cell: GenericGridCell = {
          position: { x, y },
          tiles: this.parseTileArray({ x, y }, data[y][x], abortOnError),
          light: {
            level: ambientLight,
            ambient: ambientLight,
            color: ambientLightColor,
            ambientColor: ambientLightColor
          }
        };
        field.grid.push(cell);
      }
    }

    return field;
  }

  private allocateEmptyField(size: { width: number, height: number}, params: GenericSceneAdditionalParameters): GenericGridField {
    if (size.width <= 0 || size.height <= 0) {
      throw new Error('invalid field dimensions');
    }

    const field: GenericGridField = {
      grid: [],
      width: size.width,
      height: size.height,
    };

    const ambientLight = params?.lightMap?.ambient || 0;
    const ambientLightColor = params?.lightMap?.ambientColor || [1, 1, 1];
    for (let y = 0; y < field.height; y++) {
      for (let x = 0; x < field.width; x++) {
        field.grid.push({
          position: { x, y },
          tiles: [],
          light: {
            level: ambientLight,
            ambient: ambientLight,
            color: ambientLightColor,
            ambientColor: ambientLightColor
          }
        });
      }
    }

    return field;
  }

  setupGameField(
    descriptionOrSize: FieldTilesDescriptionOrSize,
    params: GenericSceneAdditionalParameters
  ): void {
    if (Array.isArray(descriptionOrSize)) {
      this.sceneModel.field = this.parseFieldFromArray(descriptionOrSize, params, true);
    } else {
      this.sceneModel.field = this.allocateEmptyField(descriptionOrSize, params);
    }

    if (params?.tilesPerScreen) {
      this.sceneModel.inverseZoom = params.tilesPerScreen;
    }
    if (params?.pixelPerfect) {
      this.sceneModel.pixelPerfect = params.pixelPerfect;
    }
    this.sceneModel.lightMapEnabled = params?.lightMap?.enabled || false;
  }

  getCell(x: number, y: number): GenericGridCell {
    const field = this.sceneModel.field;
    if (x >= 0 && x < field.width && y >= 0 && y < field.height) {
      return field.grid[Math.floor(x) + Math.floor(y) * field.width];
    } else {
      return null;
    }
  }

  setTile(x: number, y: number, description: TileOrDescription | TileOrDescription[], addTiles?: boolean): void {
    const tiles = this.parseTileArray({ x, y }, description, true);
    const cell = this.getCell(x, y);
    if (cell) {
      if (addTiles) {
        cell.tiles = [ ...cell.tiles, ...tiles ];
      } else {
        cell.tiles = tiles;
      }
    }
  }

  addGameObject(obj: GenericGameObject): void {
    if (!obj) {
      throw new Error('null is passed to Build.addGameObject');
    }
    this.sceneModel.gameObjects.push(obj);
  }

  setPlayer(player: GenericPlayer): void {
    if (!player) {
      throw new Error('null is passed to Build.setPlayer');
    }
    this.sceneModel.player = player;
    this.addGameObject(player);
  }

  addCheckingLogic(checkingLogic: CheckingLogic): void {
    if (!checkingLogic) {
      throw new Error('null is passed to Build.addCheckingLogic');
    }
    checkingLogic = checkingLogic.bind(this.reader);
    this.sceneModel.checkingLogic = (context: any) => {
      try {
        return checkingLogic(context);
      } catch (e) {
        return 'checking logic failed with error: ' + e;
      }
    };
  }
}
