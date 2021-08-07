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
export const SimplexTask8_2 = () => {
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
  const player = new GenericPlayer({x: 3, y: 1}, {
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

  for (const voters_id in voters) {
    const variant = voters[voters_id];
    if (votes[variant] === undefined) {
      votes[variant] = 1;
    } else {
      votes[variant] ++;
    }
  }

  console.log('start');
  console.log(votes);
  console.log('next');
  console.log(arrayVoter);

  const answer = [];
  let levelPassed = false;
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 3, y: 4}, {
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
