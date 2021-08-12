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
export const SimplexTask10_1 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('moon-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 4]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-moon-tile-connect']),
    immutableTags: ['-moon-tile-connect']
  });

  TileRegistry.addBasicTile('wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 2]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-wall-connect']),
    immutableTags: [DefaultTags.OBSTACLE, '-wall-connect']
  });

  // --------- tile generation -------------
  Builder.setupGameField({width: 11, height: 11}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 11
  });

  for (let x = 0; x < 11; x++) {
    for (let y = 0; y < 11; y++) {
      Builder.setTile(x, y, 'moon-tile');
      if (y === 0 || y === 10) {
        Builder.setTile(x, y, 'wall');
      }
      if (x === 0 || x === 10) {
        Builder.setTile(x, y, 'wall');
      }
    }
  }

  // ---------- logic ---------------
  const arrayPrimeNumbers = [];
  {
    let flag = 1;
    for (let i = 2; i <= 500; i++) {
      if (flag === 0) {
        arrayPrimeNumbers.push(i - 1);
      }
      for (let j = 2; j < i; j++) {
        if (i % j === 0) {
          flag = 1;
          break;
        }
        flag = 0;
      }
    }
  }
  console.log(arrayPrimeNumbers);

  const generateRandomNumber = () => {
    if (Math.random() < 0.3) {
      const index = Math.floor(Math.random() * arrayPrimeNumbers.length);
      return arrayPrimeNumbers[index];
    }
    return Math.floor(Math.random() * 100);
  };

  const nextPrimeNumber = (x: number) => {
    let flag = 1;
    while (true) {
      for (let j = 2; j < x; j++) {
        if (x % j === 0) {
          flag = 1;
          break;
        }
        flag = 0;
      }
      if (flag === 0) {
        return x;
      }
      x++;
    }
  };

  const newRobotId = (id: number) => {
    const primeId = nextPrimeNumber(id);
    if (primeId === id) {
      return 0;
    } else {
      return primeId;
    }
  };

  let levelPassed = false;
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 5, y: 1}, {
    enableEcho: true,

    consumeOutput: (model, value) => {
      return newRobotIdSet.delete(value);
    },

    onApplied: (model, allValid) => {
      levelPassed = allValid && newRobotIdSet.size === 0;
    }
  }));


  // --------- object -------------

  const monitor = new SimpleGameObject({x: 5, y: 1}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[8, 8]],
      }
    },
    lightSources: [{brightness: 2, radius: 2, color: [0.2, 0.2, 1]}],
    mutableTags: [DefaultTags.OBSTACLE]
  });
  Builder.addGameObject(monitor);


  const newRobotIdSet = new Set<number>();
  const arrayRobots = [];
  let p = 0;
  for (let i = 0; i < 5; i++) {
    arrayRobots.push(new SimpleGameObject({x: 1 + p, y: 6}, {
      texture: {
        atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
        items: {
          on: [[11, 9]],
          off: [[10, 9]],
        }
      },
      initialState: 'on',
      lightSources: [{brightness: 2, radius: 2, color: [0.2, 0.2, 1]}],
      mutableTags: [DefaultTags.OBSTACLE]
    }));

    const array = [];
    array.push(generateRandomNumber());
    const arrayAnswer = array.map(c => {
      c = newRobotId(c);
      if (c !== 0) {
        newRobotIdSet.add(c);
      }
      return c;
    });
    Builder.addGameObject(new ConsoleTerminalGameObject({x: 1 + p, y: 6}, {
      enableEcho: true,
      requireInput: (model) => array.shift(),
      consumeOutput: (model, value: any) => {
        return arrayAnswer.shift() === value;
      },
      onApplied: (model, allValid) => {
        if (allValid && arrayAnswer.length === 0) {
          arrayRobots[i].state = 'off';
        }
      },
    }));
    p += 2;
  }

  for (const robot of arrayRobots) {
    Builder.addGameObject(robot);
  }


  // ---------  player  -------------
  const player = new GenericPlayer({x: 1, y: 5}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 3, brightness: 1},
      ],

      initialRotation: Direction.RIGHT,
      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 15
    }
  );
  Builder.setPlayer(player);

  Builder.addCheckingLogic(() => levelPassed ? null : 'INVALID_OUTPUT');
};
