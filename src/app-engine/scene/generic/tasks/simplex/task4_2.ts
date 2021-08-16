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
import {GenericReaderService} from '../../readers/generic-reader.service';
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };


// tslint:disable-next-line
export const SimplexTask4_2 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('wood-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.FULL_ONLY2, offset: [[0, 6]]}
      }
    },
    immutableTags: []
  });

  TileRegistry.addBasicTile('wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 8]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-wall-connect']),
    immutableTags: [DefaultTags.OBSTACLE, '-wall-connect']
  });

  // --------- tile generation -------------
  Builder.setupGameField({width: 9, height: 9}, {
    lightMap: {
      enabled: false
    },
    pixelPerfect: 32,
    tilesPerScreen: 6
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


  // --------- object -------------
  const positionX = Math.floor(Math.random() * 5) + 2;
  const positionY = Math.floor(Math.random() * 5) + 2;

  const letter = new SimpleGameObject({x: positionX, y: positionY}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[11, 9]],
      }
    },
    mutableTags: [DefaultTags.ITEM, 'letter']
  });
  Builder.addGameObject(letter);


  // ---------  player  -------------
  Builder.setPlayer(new GenericPlayer({x: 4, y: 4}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 1, brightness: 1},
      ],

      minVisibleLightLevel: 0.1,
      interactRange: 1,
    }
  ));

  // ---------- logic ---------------
  Builder.addCheckingLogic((reader: GenericReaderService) => {
    if (reader.getPlayer().findItemsInInventory(['letter']).length === 0) {
      return 'NO_REQUIRED_ITEM_IN_INVENTORY';
    }
    return null;
  });

};
