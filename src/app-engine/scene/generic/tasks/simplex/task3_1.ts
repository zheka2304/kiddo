import {GenericBuilderService} from '../../generic-builder.service';
import {CommonTileRegistryService} from '../../services/common-tile-registry.service';
import {CharacterSkinRegistryService} from '../../services/character-skin-registry.service';
import {InGameConsoleService} from '../../services/in-game-console.service';
import {CheckingLogic, Direction} from '../../../common/entities';
import {GenericPlayer} from '../../common/player';
import {DefaultTileStates} from '../../entities/default-tile-states.enum';
import {DefaultTags} from '../../entities/default-tags.enum';
import {ConsoleTerminalGameObject} from '../../common/console-terminal-game-object';
import {SimpleGameObject} from '../../common/simple-game-object';
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };


// tslint:disable-next-line
export const SimplexTask3_1 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('wood-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.FULL_ONLY2, offset: [[0, 6]]}
      }
    },
    immutableTags: []
  });

  TileRegistry.addBasicTile('wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 8]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-wall-connect']),
    immutableTags: [DefaultTags.OBSTACLE, '-wall-connect']
  });

  TileRegistry.addBasicTile('table', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[7, 9]],
      }
    },
    immutableTags: [DefaultTags.OBSTACLE]
  });

  TileRegistry.addBasicTile('keyboard', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[9, 8]],
      }
    },
    immutableTags: [DefaultTags.OBSTACLE]
  });

  TileRegistry.addBasicTile('papers', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[9, 9]],
      }
    },
    immutableTags: [DefaultTags.OBSTACLE]
  });

  // --------- tile generation -------------
  Builder.setupGameField({width: 7, height: 7}, {
    lightMap: {
      enabled: true,
      ambient: 0.3
    },
    pixelPerfect: 32,
    tilesPerScreen: 6
  });

  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 7; y++) {
      Builder.setTile(x, y, 'wood-tile');
      if (y === 0 || y === 6) {
        Builder.setTile(x, y, 'wall');
      }
      if (x === 0 || x === 6) {
        Builder.setTile(x, y, 'wall');
      }
    }
  }

  Builder.setTile(2, 1, ['wood-tile', 'table: {"offset": [-1, 0]}', 'papers']);
  Builder.setTile(3, 1, ['wood-tile', 'table: {"offset": [0, 0]}', 'keyboard']);
  Builder.setTile(4, 1, ['wood-tile', 'table: {"offset": [1, 0]}']);

  // ---------  player  -------------
  Builder.setPlayer(new GenericPlayer({x: 3, y: 3}, {
      skin: 'alexey',

      minVisibleLightLevel: 0.1,
      interactRange: 1,
      initialRotation: Direction.UP
    }
  ));


  // --------- object -------------
  const monitor = new SimpleGameObject({x: 3, y: 1}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[8, 8]],
      }
    },
    lightSources: [{brightness: 2, radius: 3, color: [0.15, 0.15, 1]}],
    mutableTags: [DefaultTags.OBSTACLE]
  });
  Builder.addGameObject(monitor);

  const answers = [false, 2, 1, false];

  let levelPassed = false;
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 3, y: 1}, {
    title: 'DEBUGGER',
    enableEcho: true,

    consumeOutput: (model, value: any) => {
      return answers.shift() === value;
    },

    onApplied: (model, allValid) => {
      if (allValid && answers.length === 0) {
        levelPassed = true;
      }
    },

  }));

  Builder.addCheckingLogic(() => levelPassed ? null : 'INVALID_OUTPUT');
};
