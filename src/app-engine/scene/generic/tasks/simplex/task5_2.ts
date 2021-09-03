import {GenericBuilderService} from '../../generic-builder.service';
import {CommonTileRegistryService} from '../../services/common-tile-registry.service';
import {CharacterSkinRegistryService} from '../../services/character-skin-registry.service';
import {InGameConsoleService} from '../../services/in-game-console.service';
import {CheckingLogic, Direction} from '../../../common/entities';
import {GenericPlayer} from '../../common/player';
import {DefaultTileStates} from '../../entities/default-tile-states.enum';
import {DefaultTags} from '../../entities/default-tags.enum';
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


class GameWatcher extends GameObjectBase {
  public robot: EvilRobot = null;
  public crow: CrowHero = null;
  public robotCount = 5;

  constructor(public player: GenericPlayer) {
    super({ x: 0, y: 0 });
  }


  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
    if (this.robotCount <= 0) {
      return;
    }
    if (this.robot === null || this.robot.state === 'dead') {
      const positionX = Math.floor(Math.random() * 2 + 7) * (Math.random() > .5 ? 1 : -1) + this.player.position.x;
      const positionY = Math.floor(Math.random() * 2 + 7) * (Math.random() > .5 ? 1 : -1) + this.player.position.y;
      this.robot = new EvilRobot({x: positionX, y: positionY}, Direction.RIGHT, 'robot');
      this.robot.player = this.player;
      this.crow = new CrowHero({x: positionX, y: positionY - 20 }, Direction.RIGHT, 'crow');
      this.crow.robot = this.robot;

      this.robot.addTag(DefaultTags.DEADLY);
      this.robot.addTag('robot');
      writer.addGameObject(this.robot);
      writer.addGameObject(this.crow);

      this.robotCount--;
    }
  }
}


class EvilRobot extends CharacterBase {
  public player: GenericPlayer;

  onPostTick(writer: GenericWriterService): void {
    super.onPostTick(writer);

    if (this.state === 'dead') {
      return;
    }

    for (let i = 0; i < 2; i++) {
      if (this.player.position.x > this.position.x) {
        this.direction = Direction.RIGHT;
        this.position.x++;
      } else if (this.player.position.x < this.position.x) {
        this.direction = Direction.LEFT;
        this.position.x--;
      } else if (this.player.position.y > this.position.y) {
        this.direction = Direction.DOWN;
        this.position.y++;
      } else if (this.player.position.y < this.position.y) {
        this.direction = Direction.UP;
        this.position.y--;
      }
    }

  }
}


class CrowHero extends CharacterBase {
  public robot: CharacterBase;
  public ticksUntilKill = 10;
  public flyOffCoolDown = 2;

  killRobot(): void {
    this.robot.state = 'dead';
    this.robot.removeTag('robot');
    this.robot.removeTag(DefaultTags.DEADLY);
    this.robot.position = this.robot.lastPosition;
    this.position = { ...this.robot.position };
  }

  onPostTick(writer: GenericWriterService): void {
    super.onPostTick(writer);

    if (this.robot.state === 'dead') {
      if (this.flyOffCoolDown <= 0) {
        this.direction = Direction.UP;
        this.position.y -= 2;
      }
      this.flyOffCoolDown--;
      return;
    }

    if (this.ticksUntilKill <= 0) {
      this.killRobot();
    }

    this.ticksUntilKill--;
    if (this.ticksUntilKill > 0) {
      if (this.robot.position.x > this.position.x) {
        this.direction = Direction.RIGHT;
        this.position.x++;
      } else if (this.robot.position.x < this.position.x) {
        this.direction = Direction.LEFT;
        this.position.x--;
      } else if (this.robot.position.y > this.position.y) {
        this.direction = Direction.DOWN;
        this.position.y++;
      } else if (this.robot.position.y < this.position.y) {
        this.direction = Direction.UP;
        this.position.y--;
      }

      if (this.robot.position.x === this.position.x && this.robot.position.y === this.position.y) {
        this.killRobot();
      }
    } else {
      this.position = { ...this.robot.position };
    }
  }
}


// tslint:disable-next-line
export const SimplexTask5_2 = () => {
  // --------- skin registration ---------
  CharacterSkinRegistry.addCharacterSkin('crow', {
    walkingTexture: {
      atlas: {src: 'assets:/character-atlas-crow.png', width: 3, height: 2},
      items: {
        [Direction.DOWN]: [[0, 2, 1, 1]],
        [Direction.UP]: [[0, 2, 0, 0]],
        [Direction.LEFT]: [[0, 2, 1, 1]],
        [Direction.RIGHT]: [[0, 2, 0, 0]],
      },
      fps: 6
    }
  });

  CharacterSkinRegistry.addCharacterSkin('robot', {
    idleTexture: {
      atlas: {src: 'assets:/character-atlas-robot.png', width: 6, height: 6},
      items: {
        [Direction.DOWN]: [[0, 2]],
        [Direction.UP]: [[0, 4]],
        [Direction.LEFT]: [[0, 3]],
        [Direction.RIGHT]: [[0, 5]],
        dead: [[0, 1]],
      }
    },
    walkingTexture: {
      atlas: {src: 'assets:/character-atlas-robot.png', width: 6, height: 6},
      items: {
        [Direction.DOWN]: [[0, 5, 2, 2]],
        [Direction.UP]: [[0, 5, 4, 4]],
        [Direction.LEFT]: [[0, 5, 3, 3]],
        [Direction.RIGHT]: [[0, 5, 5, 5]],
        dead: [[0, 1]],
      },
      fps: 12
    }
  });

  // --------- registration -------------

  TileRegistry.addBasicTile('grass', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: { ctType: ConnectedTextureFormatType.FULL_ONLY2, offset: [[0, 12]] }
      }
    }
  });


  // --------- tile generation -------------
  Builder.setupGameField({width: 75, height: 75}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 20,
    pixelPerfect: 32
  });

  for (let x = 0; x < 75; x++) {
    for (let y = 0; y < 75; y++) {
      Builder.setTile(x, y, 'grass');
    }
  }

  // ---------  player  -------------
  const player = new GenericPlayer({x: 37, y: 37}, {
      skin: 'parrot',
      defaultLightSources: [
        {radius: 1, brightness: 1},
      ],

      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 15
    }
  );
  Builder.setPlayer(player);


  // --------- object -------------
  const gameWatcher = new GameWatcher(player);
  Builder.addGameObject(gameWatcher);
  Builder.addCheckingLogic(() => gameWatcher.robotCount > 0 ? 'ROBOTS_REMAINING' : null);
};
