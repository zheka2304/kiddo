import {GenericBuilderService} from '../../generic-builder.service';
import {CommonTileRegistryService} from '../../services/common-tile-registry.service';
import {CharacterSkinRegistryService} from '../../services/character-skin-registry.service';
import {InGameConsoleService} from '../../services/in-game-console.service';
import {CheckingLogic} from '../../../common/entities';
import {GenericPlayer} from '../../common/player';
import {DefaultTileStates} from '../../entities/default-tile-states.enum';
import {DefaultTags} from '../../entities/default-tags.enum';
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';


// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };


// tslint:disable-next-line
export const SimplexTask1_1 = () => {
  TileRegistry.addBasicTile('wood-tile', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.FULL_ONLY, offset: [[0, 12]]}
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

  TileRegistry.addBasicTile('wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.DEFAULT, offset: [[0, 10]]}
      }
    },
    immutableTags: [DefaultTags.OBSTACLE],
    ctCheckConnected: DefaultCTLogic.HAS_TAGS([DefaultTags.OBSTACLE])
  });


  Builder.setupGameField({width: 9, height: 9}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    pixelPerfect: 32
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

  Builder.setTile(7, 5, ['wood-tile', 'goal-flag']);

  Builder.setPlayer(new GenericPlayer({x: 2, y: 1}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 1, brightness: 1},
      ],

      minVisibleLightLevel: 0.1,
      interactRange: 1,
    }
  ));

  Builder.addCheckingLogic(DefaultCheckingLogic.GOAL_REACHED);
};
