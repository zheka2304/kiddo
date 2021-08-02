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
export const SimplexTask5_1 = () => {
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
  Builder.setPlayer(new GenericPlayer({x: 4, y: 0}, {
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
    immutableTags: [DefaultTags.OBSTACLE]
  });
  Builder.addGameObject(monitor);

  // ------------ logic --------------

  const arrayString = ['ЗДЕСЬ_БЫЛ_ПОПУГАЙ_ТЧК', 'ТЫ_ЗАСВЕТИЛСЯ_ЗПТ_ЛОПУХ_ВОСКЛИЦАТЕЛЬНЫЙ_ЗНАК', 'ЗВОНЮ_ЗПТ_CРОЧНО_СНИМИ_ТРУБКУ_ТЧК', 'КДБР_ТЧК'];
  const arrayStringAnswers = arrayString.map(c => {
    // @ts-ignore
    c = c.replaceAll('ТЧК', '.');
    // @ts-ignore
    c = c.replaceAll('ЗПТ', ',');
    // @ts-ignore
    c = c.replaceAll('ВОСКЛИЦАТЕЛЬНЫЙ_ЗНАК', '!');
    // @ts-ignore
    c = c.replaceAll('_', ' ');
    return c;
  });

  let levelPassed = false;
  Builder.addGameObject(new ConsoleTerminalGameObject({x: 4, y: 4}, {
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
