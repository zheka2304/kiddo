import {GenericBuilderService} from '../../generic-builder.service';
import {CommonTileRegistryService} from '../../services/common-tile-registry.service';
import {CharacterSkinRegistryService} from '../../services/character-skin-registry.service';
import {InGameConsoleService} from '../../services/in-game-console.service';
import {CheckingLogic} from '../../../common/entities';
import {GenericPlayer} from '../../common/player';
import {DefaultTileStates} from '../../entities/default-tile-states.enum';
import {DefaultTags} from '../../entities/default-tags.enum';
import {SimpleGameObject} from '../../common/simple-game-object';
import {GenericReaderService} from '../../readers/generic-reader.service';
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';
import {ConsoleTerminalGameObject} from '../../common/console-terminal-game-object';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };


// tslint:disable-next-line
export const SimplexTask7_1 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('wood-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.FULL_ONLY2, offset: [[0, 6]] }
      }
    },
    immutableTags: []
  });

  // --------- tile generation -------------
  Builder.setupGameField({width: 9, height: 9}, {
    lightMap: {
      enabled: true,
      ambient: 0.09
    },
    tilesPerScreen: 6
  });

  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      Builder.setTile(x, y, 'wood-tile');
    }
  }

  // ---------  player  -------------
  const player = new GenericPlayer({x: 4, y: 4}, {
      skin: 'parrot',
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
  const arrayFood = [];
  const foodPositions = [];
  for (let i = 0; i < 3; i++) {
    let positionX = 0;
    let positionY = 0;
    let regenerate = true;
    while (regenerate) {
      positionX = Math.floor(Math.random() * 5 + 1);
      positionY = Math.floor(Math.random() * 5);
      regenerate = false;
      for (const last of foodPositions) {
        if (last[0] === positionX && last[1] === positionY) {
          regenerate = true;
          break;
        }
      }
    }
    foodPositions.push([positionX, positionY]);
    arrayFood.push(new SimpleGameObject({x: positionX, y: positionY}, {
      texture: {
        atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
        items: {
          [DefaultTileStates.MAIN]: [[8, 13]],
        }
      },
      immutableTags: [DefaultTags.ITEM, 'food']
    }));
  }

  for (const food of arrayFood) {
    Builder.addGameObject(food);
  }

  Builder.addGameObject(new ConsoleTerminalGameObject({x: 5, y: 4}, {
    enableEcho: true,
  }));

  // ---------- logic ---------------

  Builder.addCheckingLogic((reader: GenericReaderService) => {
    for (const food of foodPositions) {
      if (reader.getAllTagsAt(food[0], food[1]).has('food')) {
        return 'FOOD_REMAINING';
      }
    }
    return null;
  });
};
