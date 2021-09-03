import {GenericBuilderService} from '../../generic-builder.service';
import {CommonTileRegistryService} from '../../services/common-tile-registry.service';
import {CharacterSkinRegistryService} from '../../services/character-skin-registry.service';
import {InGameConsoleService} from '../../services/in-game-console.service';
import {CheckingLogic} from '../../../common/entities';
import {GenericPlayer} from '../../common/player';
import {DefaultTileStates} from '../../entities/default-tile-states.enum';
import {DefaultTags} from '../../entities/default-tags.enum';
import {ConsoleTerminalGameObject} from '../../common/console-terminal-game-object';
import {SimpleGameObject} from '../../common/simple-game-object';
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';
import {LightSourceParams} from '../../helpers/lighting-helper.service';


// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };


// tslint:disable-next-line
export const SimplexTask1_2 = () => {
  // --------- registration -------------
  TileRegistry.addBasicTile('toilet-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[6, 10]]
      }
    },
    immutableTags: []
  });

  TileRegistry.addBasicTile('toilet-wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 10]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS([DefaultTags.OBSTACLE, '-wall-connect']),
    immutableTags: [DefaultTags.OBSTACLE]
  });

  TileRegistry.addBasicTile('wood-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.FULL_ONLY, offset: [[0, 6]]}
      }
    },
    immutableTags: []
  });

  TileRegistry.addBasicTile('room-wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 8]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS([DefaultTags.OBSTACLE, '-wall-connect']),
    immutableTags: [DefaultTags.OBSTACLE]
  });

  TileRegistry.addBasicTile('door-threshold', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[6, 6]]
      }
    },
    immutableTags: ['-wall-connect']
  });

  TileRegistry.addBasicTile('toilet', {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[2, 1]]
      }
    },
  });

  // --------- tile generation -------------
  Builder.setupGameField({width: 9, height: 9}, {
    lightMap: {
      enabled: true,
      ambient: 0.4
    },
    tilesPerScreen: 8,
    pixelPerfect: 32
  });

  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      Builder.setTile(x, y, y > 4 ? 'toilet-tile' : 'wood-tile');
      if (y === 0 || y === 8) {
        Builder.setTile(x, y, y > 3 ? 'toilet-wall' : 'room-wall');
      }
      if (y === 4) {
        Builder.setTile(x, y, y > 3 ? 'toilet-wall' : 'room-wall');
      }
      if (x === 0 || x === 8) {
        Builder.setTile(x, y, y > 3 ? 'toilet-wall' : 'room-wall');
      }
    }
  }
  Builder.setTile(4, 4, ['door-threshold']);

  Builder.setTile(4, 0, ['door-threshold']);

  Builder.setTile(1, 6, ['toilet-tile', 'toilet']);




  // --------- object -------------

  const door = new SimpleGameObject({x: 4, y: 4}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        closed: [[6, 11]],
        open: [[7, 11]]
      }
    },
    initialState: 'closed',
    mutableTags: [DefaultTags.OBSTACLE]
  });
  Builder.addGameObject(door);

  const finish = new SimpleGameObject({x: 4, y: 0}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        closed: [[6, 8]],
        open: [[7, 8]]
      }
    },
    initialState: 'open',
    immutableTags: [DefaultTags.GOAL]
  });
  Builder.addGameObject(finish);

  const a = 123;
  const b = 356;
  const ab = [a, b];
  let answer = 0;

  Builder.addGameObject(new ConsoleTerminalGameObject({x: 4, y: 4}, {
    enableEcho: true,

    requireInput: (model) => ab.shift(),

    consumeOutput: (model, value: any) => {
      answer = value;
      return answer === a * b;
    },

    onApplied: () => {
      if (answer === a * b) {
        door.removeTag(DefaultTags.OBSTACLE);
        door.state = 'open';
      } else {
        door.addTag(DefaultTags.OBSTACLE);
        door.state = 'closed';
      }
    },
  }));

  // -------- lights ------------

  const addLightSource = (x: number, y: number, light: LightSourceParams) => {
    Builder.addGameObject(new SimpleGameObject({x, y}, {
      lightSources: [ light ]
    }));
  };

  for (const lightX of [2, 4, 6]) {
    for (const lightY of [2, 6]) {
      addLightSource(lightX, lightY, { brightness: 0.75, radius: 4 });
    }
  }


  // ---------  player  -------------
  Builder.setPlayer(new GenericPlayer({x: 1, y: 6}, {
      skin: 'alexey',

      minVisibleLightLevel: 0.1,
      interactRange: 1,
    }
  ));

  Builder.addCheckingLogic(DefaultCheckingLogic.GOAL_REACHED);
};
