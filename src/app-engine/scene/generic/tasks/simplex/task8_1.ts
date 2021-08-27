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
import {LightSourceParams} from '../../helpers/lighting-helper.service';


// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };


// tslint:disable-next-line
export const SimplexTask8_1 = () => {
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
        [DefaultTileStates.MAIN]: [[8, 10]],
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
  Builder.setupGameField({width: 9, height: 9}, {
    lightMap: {
      enabled: true,
      ambient: 0.3
    },
    tilesPerScreen: 8.5
  });

  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      Builder.setTile(x, y, 'wood-tile');
      if (y === 0 || y === 8) {
        Builder.setTile(x, y, 'wall');
      }
      if (x === 0 || x === 8) {
        Builder.setTile(x, y, 'wall');
      }
    }
  }

  const addLightSource = (x: number, y: number, light: LightSourceParams) => {
    Builder.addGameObject(new SimpleGameObject({x, y}, {
      lightSources: [ light ]
    }));
  };

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      Builder.setTile(x + 3, y + 2, `table:{"offset":[${x}, ${y}]}`, true);
      addLightSource(x + 3, y + 2, { brightness: 0.5, radius: 2, color: [0.3, 1, 1] });
    }
  }

  // ---------  player  -------------
  const player = new GenericPlayer({x: 4, y: 5}, {
      skin: 'alexey',

      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 6,

      initialRotation: Direction.UP
    }
  );
  Builder.setPlayer(player);


  // ---------- logic ---------------

  const generatePacket = (array: number[], answers: number[]) => {
    let sum = 0;
    const randomSize = Math.floor(Math.random() * 5 + 2);
    for (let i = 0; i < randomSize; i++) {
      const randomNumber = Math.floor(Math.random() * 10 + 1);
      array.push(randomNumber);
      sum += randomNumber;
    }
    if (Math.random() < 0.7) {
      array.push(sum);
      answers.push(1);
    } else {
      array.push(Math.floor(Math.random() * 10 + 1) + sum);
      answers.push(0);
    }
    array.push(0);
  };

  const packets = [];
  const packetsAnswers = [];
  const countPacket = Math.floor(Math.random() * 4 + 2);
  for (let i = 0; i < countPacket; i++) {
    generatePacket(packets, packetsAnswers);
  }


  let levelPassed = false;
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 4, y: 4}, {
    enableEcho: true,

    requireInput: () => {
      return packets.shift();
    },
    consumeOutput: (model, value: any) => {
      return packetsAnswers.shift() === value;
    },
    onApplied: (model, allValid) => {
      if (allValid && packetsAnswers.length === 0) {
        levelPassed = true;
      }
    },
  }));

  Builder.addCheckingLogic(() => levelPassed ? null : 'INVALID_OUTPUT');
};
