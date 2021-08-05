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

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };


class EvilTrash extends SimpleGameObject {
  constructor(position: Coords) {
    super(position, {
      texture: {
        atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
        items: {
          [DefaultTileStates.MAIN]: [[1, 2]],
        }
      },
      immutableTags: [DefaultTags.DEADLY]
    });
  }

  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
    this.position.y++;
  }
}

class GameWatcher extends GameObjectBase {
  public ticks = 0;

  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
    this.ticks++;
    if (this.ticks % 3 === 0) {
      for (let i = 0; i < 20; i++) {
        if (Math.random() < 0.40) {
          writer.addGameObject(new EvilTrash({x: 2 * i + 1, y: -1}));
        }
      }
    }


  }
}

// tslint:disable-next-line
export const SimplexTask6_1 = () => {
  // --------- skin registration ---------


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

  TileRegistry.addBasicTile('goal-flag', {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[2, 0]]
      }
    },
    immutableTags: [DefaultTags.GOAL]
  });


  // --------- tile generation -------------
  Builder.setupGameField({width: 21, height: 10}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 8,
    pixelPerfect: 32
  });

  for (let x = 0; x < 21; x++) {
    for (let y = 0; y < 10; y++) {
      Builder.setTile(x, y, 'wood-tile');
    }
  }

  Builder.setTile(20, 8, ['wood-tile', 'goal-flag']);

  // ---------  player  -------------
  const player = new GenericPlayer({x: 0, y: 8}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 1, brightness: 1},
      ],

      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 6
    }
  );
  Builder.setPlayer(player);


  // --------- object -------------

  Builder.addGameObject(new GameWatcher({x: 0, y: 0}));

  // ---------- logic ---------------

  Builder.addCheckingLogic(DefaultCheckingLogic.GOAL_REACHED);
};
