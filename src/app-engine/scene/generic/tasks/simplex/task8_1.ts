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

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };


// tslint:disable-next-line
export const SimplexTask8_1 = () => {
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
    }
  }

  // ---------  player  -------------
  const player = new GenericPlayer({x: 2, y: 4}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 3, brightness: 1},
      ],

      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 6
    }
  );
  Builder.setPlayer(player);


  // --------- object -------------

  const monitor = new SimpleGameObject({x: 3, y: 4}, {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[0, 2]],
      }
    },
    mutableTags: [DefaultTags.OBSTACLE]
  });
  Builder.addGameObject(monitor);
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
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 3, y: 4}, {
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
