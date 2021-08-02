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

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };


// tslint:disable-next-line
export const SimplexTask1_3 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('wood-tile', {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[1, 0]]
      }
    },
    immutableTags: []
  });

  TileRegistry.addBasicTile('wall', {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[0, 0]]
      }
    },
    immutableTags: []
  });

  // --------- tile generation -------------
  Builder.setupGameField({width: 9, height: 9}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
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

  // ---------  player  -------------
  Builder.setPlayer(new GenericPlayer({x: 1, y: 6}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 1, brightness: 1},
      ],

      minVisibleLightLevel: 0.1,
      interactRange: 1,
    }
  ));


  // --------- object -------------
  const monitor = new SimpleGameObject({x: 4, y: 4}, {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[0, 2]],
      }
    },
    mutableTags: [DefaultTags.OBSTACLE]
  });
  Builder.addGameObject(monitor);

  const generateString = () => {
    if (Math.random() < 0.2) {
      return 'женщина';
    }
    if (Math.random() < 0.2) {
      return 'мужчина';
    }
    const alphabet = Math.random() < 0.7 ? 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя' : '1234567890';
    const randomSize = Math.floor(Math.random() * 6) + 4;
    let randomWord = '';
    for (let i = 0; i < randomSize; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      randomWord += alphabet[randomIndex];
    }
    return (randomWord);
  };

  const arrayString = [];
  const size = Math.floor(Math.random() * 10) + 5;
  for (let i = 0; i < size; i++) {
    arrayString.push(generateString());
  }

  const arrayStringAnswers = arrayString.map(c => {
    if (c === 'женщина') {
      return 'мужчина';
    }
    if (c === 'мужчина') {
      return 'женщина';
    }
    return c;
  });

  let levelPassed = false;
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 4, y: 4}, {
    title: 'test',
    enableEcho: true,

    requireInput: (model) => arrayString.shift(),

    consumeOutput: (model, value: any) => {
      return arrayStringAnswers.shift() === value;
    },

    onApplied: (model, allValid) => {
      if (allValid && arrayStringAnswers.length === 0) {
        levelPassed = true;
      }
    },
  }));

  Builder.addCheckingLogic(() => levelPassed ? null : 'INVALID_OUTPUT');
};
