import {ConsoleTerminalGameObject} from '../../common/console-terminal-game-object';
import {GenericPlayer} from '../../common/player';
import {GenericBuilderService} from '../../generic-builder.service';
import {CommonTileRegistryService} from '../../services/common-tile-registry.service';
import {CharacterSkinRegistryService} from '../../services/character-skin-registry.service';
import {InGameConsoleService} from '../../services/in-game-console.service';
import {CheckingLogic, Direction} from '../../../common/entities';
import {SimpleGameObject} from "../../common/simple-game-object";

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };


// tslint:disable-next-line
export const SimplexTaskTest = () => {
  TileRegistry.addBasicTile('water', {
    texture: {
      atlas: { src: 'assets:/tile-atlas.png', width: 4, height: 4 },
      items: {
        main: [[1, 1]]
      }
    },
    immutableTags: ['obstacle', 'liquid']
  });

  Builder.setupGameField([
    ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass;goal-flag', 'water', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'stone'],
    ['stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone'],
  ], {
    lightMap: {
      enabled: true,
      ambient: 0.09
    },
    pixelPerfect: 32
  });

  Builder.addGameObject(new SimpleGameObject({x: 3, y: 1}, {
    texture: {
      atlas: { src: 'assets:/tile-atlas.png', width: 4, height: 4 },
      items: {
        main: [[2, 1]]
      }
    },
    item: {
      name: 'test item'
    }
  }));

  Builder.setPlayer(new GenericPlayer({x: 1, y: 1}, {
    skin: 'link',
    defaultLightSources: [
      { radius: 1, brightness: 1 },
      { radius: 2, brightness: 1, offset: { x: 0, y: 1 } }
    ],

    minVisibleLightLevel: 0.1,
    interactRange: 1,
    lookRange: 3
  }));

  Builder.addGameObject(new ConsoleTerminalGameObject({x: 2, y: 2}, {
    title: 'test',
    enableEcho: true,

    requireInput: () => 1,
    consumeOutput: () => true,
    onApplied: () => console.log('apply'),
  }));

  Builder.addCheckingLogic(DefaultCheckingLogic.GOAL_REACHED);
};

