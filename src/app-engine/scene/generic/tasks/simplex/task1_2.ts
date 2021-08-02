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
export const SimplexTask1_2 = () => {
  // --------- registration -------------
  TileRegistry.addBasicTile('toilet-tile', {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[1, 1]]
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
    immutableTags: [DefaultTags.OBSTACLE]
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
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 9
  });

  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      Builder.setTile(x, y, 'toilet-tile');
      if (y === 0 || y === 8) {
        Builder.setTile(x, y, 'wall');
      }
      if (y === 4) {
        Builder.setTile(x, y, 'wall');
      }
      if (x === 0 || x === 8) {
        Builder.setTile(x, y, 'wall');
      }
    }
  }
  Builder.setTile(4, 4, ['toilet-tile']);

  Builder.setTile(4, 0, ['toilet-tile']);

  Builder.setTile(1, 6, ['toilet-tile', 'toilet']);


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
  const door = new SimpleGameObject({x: 4, y: 4}, {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        closed: [[3, 0]],
        open: [[3, 1]]
      }
    },
    initialState: 'closed',
    mutableTags: [DefaultTags.OBSTACLE]
  });
  Builder.addGameObject(door);

  const finish = new SimpleGameObject({x: 4, y: 0}, {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        open: [[3, 1]]
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
      return true;
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

  Builder.addCheckingLogic(DefaultCheckingLogic.GOAL_REACHED);
};
