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
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';

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
      immutableTags: [DefaultTags.DEADLY, 'trash']
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
    if (this.ticks % 3 === 0) {
      for (let i = 0; i < 16; i++) {
        if (Math.random() < 0.45) {
          writer.addGameObject(new EvilTrash({x: 2 * i + 1, y: -1}));
        }
      }
    }
    this.ticks++;
  }
}

// tslint:disable-next-line
export const SimplexTask6_1 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('grass', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.FULL_ONLY2, offset: [[0, 12]] }
      }
    }
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
  Builder.setupGameField({width: 31, height: 10}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 8,
    pixelPerfect: 32
  });

  for (let x = 0; x < 31; x++) {
    for (let y = 0; y < 10; y++) {
      Builder.setTile(x, y, 'grass');
    }
  }

  Builder.setTile(30, 8, ['grass', 'goal-flag']);

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
