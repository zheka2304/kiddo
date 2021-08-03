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
import {GameObjectBase} from '../../common/game-object-base';
import {GenericWriterService} from '../../writers/generic-writer.service';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };


class TickCounter extends GameObjectBase {
  public ticks = 0;
  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
    this.ticks ++;
  }
}

// tslint:disable-next-line
export const SimplexTask4_1 = () => {
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

  TileRegistry.addBasicTile('wall', {
    texture: {
      atlas: {src: 'assets:/tile-atlas.png', width: 4, height: 4},
      items: {
        [DefaultTileStates.MAIN]: [[0, 0]]
      }
    },
    immutableTags: [DefaultTags.OBSTACLE]
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
  Builder.setupGameField({width: 21, height: 21}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 21
  });


  for (let i = 0; i < 21; i++) {
    for (let j = 0; j < 21; j++) {
      Builder.setTile(i, j, 'wall');
      if (i === 0 || j === 20) {
        Builder.setTile(i, j, 'wood-tile');
      }
    }
  }
  Builder.setTile(10, 10, 'wood-tile');

  const x = 0;
  const y = 0;
  const turn = {
    right: [x, y],
    left: [x, y],
    up: [x, y],
    down: [x, y]
  };
  {
    const cX = 19;
    const cY = 20;
    let height = 0;
    let width = 0;
    let offsetX = 0;
    let offsetY = 0;
    while (offsetX < Math.ceil(cX / 2)) {
      turn.right[0] = cX - offsetX;
      turn.right[1] = offsetY;
      offsetX += 2;
      offsetY += 2;
      for (width; width < turn.right[0]; width++) {
        Builder.setTile(width, height, 'wood-tile');
      } // w = 20 h =0
      turn.down[1] = cY - offsetY;
      turn.down[0] = offsetX;
      for (height; height < turn.down[1]; height++) {
        Builder.setTile(width, height, 'wood-tile');
      } // w = 20 h =  20
      turn.left[0] = offsetX;
      turn.left[1] = offsetY;
      for (width; width > turn.left[0]; width--) {
        Builder.setTile(width, height, 'wood-tile');
      } // w = 0 h = 20
      turn.up[0] = offsetX;
      turn.up[1] = offsetY;
      for (height; height > turn.up[1]; height--) {
        Builder.setTile(width, height, 'wood-tile');
      } // w = 0 h = 0

    }
  }

  const reserveTime = 4;
  const positionFinish = [
    {pos: [0, 0], limit: 229 + reserveTime},
    {pos: [0, 20], limit: 251 + reserveTime},
    {pos: [20, 20], limit: 274 + reserveTime},
    {pos: [19, 0], limit: 208 + reserveTime},
    {pos: [19, 18], limit: 188 + reserveTime},
    {pos: [2, 18], limit: 169 + reserveTime},
    {pos: [2, 2], limit: 151 + reserveTime},
    {pos: [17, 2], limit: 134 + reserveTime},
    {pos: [17, 16], limit: 118 + reserveTime},
    {pos: [4, 16], limit: 103 + reserveTime},
  ];
  const positionIndex = Math.floor(Math.random() * positionFinish.length);
  Builder.setTile(positionFinish[positionIndex].pos[0], positionFinish[positionIndex].pos[1], ['wood-tile', 'goal-flag']);


// ---------  player  -------------
  Builder.setPlayer(new GenericPlayer({x: 10, y: 10}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 1, brightness: 1},
      ],

      minVisibleLightLevel: 0.1,
      interactRange: 1,
    }
  ));


// --------- object -------------

  const tickCounter = new TickCounter({x: 0, y: 0});
  Builder.addGameObject(tickCounter);

  const goalReachedCheck = DefaultCheckingLogic.GOAL_REACHED;
  Builder.addCheckingLogic(reader => {
    if (tickCounter.ticks > positionFinish[positionIndex].limit) {
      return 'TIME_LIMIT_EXCEEDED';
    } else {
      return goalReachedCheck(reader);
    }
  });
};
