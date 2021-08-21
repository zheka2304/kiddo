import {GenericBuilderService} from '../../generic-builder.service';
import {CommonTileRegistryService} from '../../services/common-tile-registry.service';
import {CharacterSkinRegistryService} from '../../services/character-skin-registry.service';
import {InGameConsoleService} from '../../services/in-game-console.service';
import {CheckingLogic, Coords, Direction} from '../../../common/entities';
import {GenericPlayer} from '../../common/player';
import {DefaultTileStates} from '../../entities/default-tile-states.enum';
import {DefaultTags} from '../../entities/default-tags.enum';
import {ConsoleTerminalGameObject} from '../../common/console-terminal-game-object';
import {SimpleGameObject} from '../../common/simple-game-object';
import {CharacterBase} from '../../common/character-base';
import {GenericWriterService} from '../../writers/generic-writer.service';
import {GameObjectBase} from '../../common/game-object-base';
import {GenericReaderService} from '../../readers/generic-reader.service';
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
export const SimplexTask8_2 = () => {
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
      skin: 'link',

      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 6,

      initialRotation: Direction.UP
    }
  );
  Builder.setPlayer(player);


  // ---------- logic ---------------
  const arrayVoter = [];
  const voters = {};
  const votes = {};
  for (let i = 0; i < 10; i++) {
    const randomNumberId = Math.floor(Math.random() * 100 + 5);
    const randomNumberVariant = Math.floor(Math.random() * 5 + 1);
    arrayVoter.push(randomNumberId);
    arrayVoter.push(randomNumberVariant);
    if (voters[randomNumberId] === undefined) {
      voters[randomNumberId] = randomNumberVariant;
    }
  }

  for (const votersId in voters) {
    const variant = voters[votersId];
    if (votes[variant] === undefined) {
      votes[variant] = 1;
    } else {
      votes[variant] ++;
    }
  }

  const answer = [];
  let levelPassed = false;
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 4, y: 4}, {
    enableEcho: true,

    requireInput: () => {
      return arrayVoter.shift();
    },

    consumeOutput: (model, value) =>  {
      answer.push(value);
      return true;
    },

    onApplied: (model, allValid) => {
      levelPassed = true;
      let resultLength = 0;
      for (const i in votes) { resultLength++; }
      if (resultLength * 2 !== answer.length) {
        levelPassed = false;
        return;
      }
      for (let i = 0; i < answer.length; i += 2) {
        const variant = answer[i];
        const count = answer[i + 1];
        if (votes[variant] !== count) {
          levelPassed = false;
          break;
        }
      }
    }
  }));

  Builder.addCheckingLogic(() => levelPassed ? null : 'INVALID_OUTPUT');
};
