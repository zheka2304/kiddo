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
export const SimplexTask7 = () => {
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
      enabled: true,
      ambient: 0.09
    },
    tilesPerScreen: 9
  });

  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      Builder.setTile(x, y, 'wood-tile');
    }
  }

  // ---------  player  -------------
  const player = new GenericPlayer({x: 4, y: 4}, {
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
        atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
        items: {
          [DefaultTileStates.MAIN]: [[2, 2]],
        }
      },
      immutableTags: [DefaultTags.ITEM, 'food']
    }));
  }

  for (const food of arrayFood) {
    Builder.addGameObject(food);
  }


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
