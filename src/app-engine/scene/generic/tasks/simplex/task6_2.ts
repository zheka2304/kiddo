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
import {GenericWriterService} from '../../writers/generic-writer.service';
import {GameObjectBase} from '../../common/game-object-base';
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';
import {GenericGameObject} from '../../entities/generic-game-object';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };

class MyConsole extends ConsoleTerminalGameObject {
  public activate = false;

  onInteract(writer: GenericWriterService, interactingObject: GenericGameObject): boolean {
    if (!this.activate) {
      return false;
    }
    return super.onInteract(writer, interactingObject);
  }
}

class GameWatcher extends GameObjectBase {
  public console: MyConsole;

  onTick(writer: GenericWriterService): void {
    super.onTick(writer);

    if (writer.getReader().getAllTagsAt(this.console.position.x, this.console.position.y).has('letter')) {
      this.console.activate = true;
    }
  }
}


// tslint:disable-next-line
export const SimplexTask6_2 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('wood-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.FULL_ONLY2, offset: [[0, 6]]}
      }
    },
    immutableTags: []
  });

  TileRegistry.addBasicTile('wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 8]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-wall-connect']),
    immutableTags: [DefaultTags.OBSTACLE, '-wall-connect']
  });

  TileRegistry.addBasicTile('table', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[7, 9]],
      }
    },
    immutableTags: [DefaultTags.OBSTACLE]
  });

  // --------- tile generation -------------
  Builder.setupGameField({width: 7, height: 7}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 7
  });

  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 7; y++) {
      Builder.setTile(x, y, 'wood-tile');
      if (y === 0 || y === 6) {
        Builder.setTile(x, y, 'wall');
      }
      if (x === 0 || x === 6) {
        Builder.setTile(x, y, 'wall');
      }
    }
  }

  Builder.setTile(2, 1, ['wood-tile', 'table: {"offset": [-1, 0]}']);
  Builder.setTile(3, 1, ['wood-tile', 'table: {"offset": [0, 0]}']);
  Builder.setTile(4, 1, ['wood-tile', 'table: {"offset": [1, 0]}']);


  // --------- object -------------

  const letter = new SimpleGameObject({x: 3, y: 3}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[11, 9]],
      }
    },
    mutableTags: [DefaultTags.ITEM, 'letter'],
    item: { ignoreObstacle: true }
  });
  Builder.addGameObject(letter);

  const generateString = () => {
    const result = [];
    const countRandomSize = Math.floor(Math.random() * 5) + 2;
    for (let j = 0; j < countRandomSize; j++) {
      const randomSizeForString = Math.floor(Math.random() * 3) + 2;
      let a = ' ';
      for (let i = 0; i < randomSizeForString; i++) {
        a += a;
      }
      result.push(a);
    }
    return result;
  };

  const arrayString = generateString();
  const arrayStringAnswers = [arrayString.join('\n')];

  let levelPassed = false;
  const console = new MyConsole({x: 3, y: 1}, {
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
    }
  );
  const gameWatcher = new GameWatcher({x: 0, y: 0});
  Builder.addGameObject(gameWatcher);
  Builder.addGameObject(console);
  gameWatcher.console = console;

  // ---------  player  -------------
  const player = new GenericPlayer({x: 3, y: 4}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 3, brightness: 1},
      ],

      initialRotation: Direction.UP,
      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 6
    }
  );
  Builder.setPlayer(player);

  // ---------- logic ---------------

  Builder.addCheckingLogic(() => levelPassed ? null : 'INVALID_OUTPUT');
};
