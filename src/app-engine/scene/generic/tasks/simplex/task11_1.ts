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
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';
import {GameObjectBase} from '../../common/game-object-base';
import {GenericWriterService} from '../../writers/generic-writer.service';
import {CharacterActionType} from '../../common/character-base';
import {GenericSceneContextProvider} from '../../common/generic-scene-context-provider';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const SceneContextProvider: GenericSceneContextProvider;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };


const roomIdByCoords = (x, y) => {
 const ox = Math.floor(x / 10) ;
 const oy = Math.floor(y / 10) ;
 return `${ox}:${oy}`;
};

const roomCenterById = (roomId: string) => {
  const coords = roomId.split(':').map(n => parseInt(n, 10));
  return coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]) ? { x: coords[0] * 10 + 5, y: coords[1] * 10 + 5 } : null;
};

// ------------ BFS ----------------
const BFS = (target: Coords) => {
  const reader = SceneContextProvider.getReader();
  const start = reader.getPlayer().position;
  // reader.getPlayer().addAction(target, CharacterActionType.ITEM);

  const queue = [];
  const visited = {};
  queue.push(start);
  visited[`${start.x}: ${start.y}`] = [start];
  while (queue.length > 0) {
    const node = queue.shift();
    const tags = reader.getAllTagsAt(node.x, node.y);
    if (tags.has('-station-floor') && !tags.has(DefaultTags.OBSTACLE)) {
      if (node.x === target.x && node.y === target.y) {
        break;
      }
      // reader.getPlayer().addAction(node, CharacterActionType.READ);
      const neighbors = [
        {x: node.x, y: node.y - 1, dir: 'up'},
        {x: node.x, y: node.y + 1, dir: 'down'},
        {x: node.x + 1, y: node.y, dir: 'right'},
        {x: node.x - 1, y: node.y, dir: 'left'},
      ];
      const path = visited[`${node.x}: ${node.y}`];
      for (const neighbor of neighbors) {
        if (visited[`${neighbor.x}: ${neighbor.y}`] === undefined) {
          queue.push(neighbor);
          visited[`${neighbor.x}: ${neighbor.y}`] = [...path, neighbor];
        }
      }
    }
  }
  return visited[`${target.x}: ${target.y}`];
};

const pathToCommands = (targetPath) => {
  const directions = targetPath.slice(1).map(c => c.dir);
  let lastStep = SceneContextProvider.getReader().getPlayer().direction.toLowerCase();
  const newTurn = [];
  let counterStep = 1;
  for (const dir of directions) {
    if (lastStep === dir) {
      counterStep += 1;
      lastStep = dir;
      continue;
    }
    if (counterStep > 0) {
      newTurn.push('move');
      newTurn.push(counterStep);
      counterStep = 1;
    }
    if (lastStep === 'left' && dir === 'down') {
      newTurn.push('left');
    } else if (lastStep === 'left' && dir === 'up') {
      newTurn.push('right');
    } else if (lastStep === 'right' && dir === 'down') {
      newTurn.push('right');
    } else if (lastStep === 'right' && dir === 'up') {
      newTurn.push('left');
    } else if (lastStep === 'down' && dir === 'right') {
      newTurn.push('left');
    } else if (lastStep === 'down' && dir === 'left') {
      newTurn.push('right');
    } else if (lastStep === 'up' && dir === 'right') {
      newTurn.push('right');
    } else if (lastStep === 'up' && dir === 'left') {
      newTurn.push('left');
    } else if (lastStep === 'up' && dir === 'down') {
      newTurn.push('right');
      newTurn.push('right');
    }
    lastStep = dir;
  }
  if (counterStep > 0) {
    newTurn.push('move');
    newTurn.push(counterStep);
    counterStep = 1;
  }
  return newTurn;
};

// tslint:disable-next-line
export const SimplexTask11_1 = () => {
  // --------- registration -------------

  TileRegistry.addBasicTile('station-floor', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.FULL_ONLY, offset: [[6, 4]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-station-floor']),
    immutableTags: ['-station-floor']
  });

  TileRegistry.addBasicTile('station-wall', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.DEFAULT, offset: [[6, 2]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-station-wall']),
    immutableTags: [DefaultTags.OBSTACLE, '-station-wall']
  });

  TileRegistry.addBasicTile('station-wall-front', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.DEFAULT, offset: [[14, 2]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-station-wall-front']),
    immutableTags: [DefaultTags.OBSTACLE, '-station-wall-front']
  });

  TileRegistry.addBasicTile('moon-stone', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.FULL_ONLY, offset: [[6, 0]]}
      }
    }
  });

  TileRegistry.addBasicTile('moon-stone-decoration', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.FULL_ONLY, offset: [[8, 0]]}
      }
    }
  });

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
  Builder.setupGameField({width: 101, height: 101}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 35,
  });

  const consoleObject = (ox, oy) => {
    Builder.addGameObject(new SimpleGameObject({x: 3 + ox, y: 1 + oy}, {
      texture: {
        atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
        items: {
          [DefaultTileStates.MAIN]: [[16, 3]],
        }
      },
      immutableTags: [DefaultTags.ITEM, 'console'],
      item: {ignoreObstacle: true}
    }));

    const generateString = () => {
      const alphabet = Math.random() < 0.7 ? 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя' : '1234567890';
      const randomSize = Math.floor(Math.random() * 6) + 4;
      let randomWord = '';
      for (let i = 0; i < randomSize; i++) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        randomWord += alphabet[randomIndex];
      }
      return (randomWord);
    };

    let consoleInputs = [];
    const randomIndex = Math.floor(Math.random() * 5);
    for (let i = 0; i < 6; i++) {
      consoleInputs.push(generateString());
    }
    consoleInputs[randomIndex] = 'пароль';

    const password = consoleInputs[randomIndex + 1];
    let passwordCorrect = false;

    Builder.addGameObject(new ConsoleTerminalGameObject({x: 3 + ox, y: 1 + oy}, {
      enableEcho: true,
      disablePreview: true,

      requireInput: (model) => consoleInputs.shift(),

      consumeOutput: (model, value: any) => {
        if (!passwordCorrect) {
          if (value === password) {
            setTimeout(() => model.lines = ['!{green}ПРАВИЛЬНЫЙ ПАРОЛЬ!', 'ВВЕДИТЕ КОМАНДУ:'], 0);
            passwordCorrect = true;
          } else {
            setTimeout(() => model.lines.push('!{red}НЕПРАВИЛЬНЫЙ ПАРОЛЬ!'), 0);
            passwordCorrect = false;
          }
        } else {
          const command = (value as string).split(' ');
          if (command[0] === 'путь') {
            const target = command[1];
            // noinspection NonAsciiCharacters
            const indexByTarget = {
              энергия1: 0,
              энергия2: 1,
              энергия3: 2,
              энергия4: 3,
            };
            const targetPosition = arrayEnergyPositions[indexByTarget[target]];
            if (targetPosition) {
              const rawPath = BFS(targetPosition);
              if (rawPath) {
                consoleInputs = pathToCommands(rawPath);
                setTimeout(() => model.lines.push(`!{green}ПУТЬ ПОСТРОЕН, ДЛИНА ${rawPath.length}`), 0);
              } else {
                consoleInputs = [];
                setTimeout(() => model.lines.push('!{yellow}ПУТЬ НЕ НАЙДЕН'), 0);
              }
              return true;
            } else {
              setTimeout(() => model.lines.push('!{red}НЕПРАВИЛЬНАЯ ЦЕЛЬ: ' + target), 0);
              consoleInputs = [];
              return false;
            }
          } else if (command[0] === 'двери') {
            const roomId = command[1];
            const action = command[2];
            const roomPos = roomCenterById(roomId);
            if (!roomPos) {
              setTimeout(() => model.lines.push('!{red}НЕКОРРЕКТНАЯ КОМНАТА: ' + roomId), 0);
              consoleInputs = [];
              return false;
            }
            if (action !== 'открыть' && action !== 'закрыть') {
              setTimeout(() => model.lines.push('!{red}НЕКОРРЕКТНОЕ ДЕЙСТВИЕ: ' + action), 0);
              consoleInputs = [];
              return false;
            }

            const doorPositions = [
              { x: roomPos.x, y: roomPos.y - 3 },
              { x: roomPos.x, y: roomPos.y + 7 },
              { x: roomPos.x - 5, y: roomPos.y },
              { x: roomPos.x + 5, y: roomPos.y },
            ];
            const reader = SceneContextProvider.getReader();
            let doorCounter = 0;
            for (const doorPosition of doorPositions) {
              for (const gameObject of reader.getGameObjectsAt(doorPosition.x, doorPosition.y)) {
                if (gameObject.getTags().has('door')) {
                  if (action === 'открыть') {
                    (gameObject as SimpleGameObject).state = 'open';
                    gameObject.removeTag(DefaultTags.OBSTACLE);
                  } else {
                    (gameObject as SimpleGameObject).state = 'close';
                    gameObject.addTag(DefaultTags.OBSTACLE);
                  }
                  doorCounter++;
                }
              }
            }

            setTimeout(() => model.lines.push(`!{yellow} ЗАДЕЙСТВОВАНО ${doorCounter} ДВЕРЕЙ`), 0);
          }
        }
        return true;
      },
    }));

  };

  const generateRoom = (ox: number, oy: number) => {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        Builder.setTile(x + ox, y + oy, 'station-floor');
        if (y === 0 || y === 8) {
          Builder.setTile(x + ox, y + oy, 'station-wall');
        }
        if (y === 1) {
          Builder.setTile(x + ox, y + oy, 'station-wall-front');
        }
        if (x === 0 || x === 8) {
          Builder.setTile(x + ox, y + oy, 'station-wall');
        }

        consoleObject(ox, oy);
      }
    }
  };

  {
    for (let w = 0; w < 101; w++) {
      for (let h = 0; h < 101; h++) {
        Builder.setTile(w, h, 'moon-stone', true);
      }
    }
  }

  {
    for (let i = 0; i < 101; i += 10) {
      for (let j = 0; j < 101; j += 10) {
        if (Math.random() < 1 || i === 0 && j === 0) {
          generateRoom(i + 1, j + 1);
        }
      }
    }
  }

  let offsetY = 5;
  while (offsetY < 101) {
    for (let x = 10; x < 101; x += 10) {
      if (Math.random() < 1) {
        if (Builder.getTileTagsAt(x + 2, offsetY).has('-station-floor') && Builder.getTileTagsAt(x - 2, offsetY).has('-station-floor')) {
          const door = new SimpleGameObject({x, y: offsetY}, {
            texture: {
              atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
              items: {
                close: [[16, 2]],
                open: [[17, 2]],
              }
            },
            immutableTags: ['door'],
            initialState: 'open',
          });
          Builder.addGameObject(door);

          Builder.setTile(x, offsetY - 1, 'station-wall');
          Builder.setTile(x - 1, offsetY, 'station-floor');
          Builder.setTile(x, offsetY, 'station-floor');
          Builder.setTile(x + 1, offsetY, 'station-floor');
          Builder.setTile(x, offsetY + 1, 'station-wall');
        }
      }
    }
    offsetY += 10;
  }
  let offsetX = 5;
  while (offsetX < 102) {
    for (let y = 10; y < 102; y += 10) {
      if (Math.random() < 1) {
        if (Builder.getTileTagsAt(offsetX, y + 3).has('-station-floor') &&
          Builder.getTileTagsAt(offsetX, y - 3).has('-station-floor')) {
          const door = new SimpleGameObject({x: offsetX, y: y + 2}, {
            texture: {
              atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
              items: {
                close: [[16, 2]],
                open: [[17, 2]],
              }
            },
            immutableTags: ['door'],
            initialState: 'open',
          });
          Builder.addGameObject(new ConsoleTerminalGameObject({x: offsetX, y: y + 2}, {
            enableEcho: true,
          }));

          Builder.addGameObject(door);
          Builder.setTile(offsetX - 1, y, 'station-wall');
          Builder.setTile(offsetX, y - 1, 'station-floor');
          Builder.setTile(offsetX, y, 'station-floor');
          Builder.setTile(offsetX, y + 1, 'station-floor');
          Builder.setTile(offsetX, y + 2, ['station-floor']);
          Builder.setTile(offsetX + 1, y, 'station-wall');
        }
      }
    }
    offsetX += 10;
  }


// --------- object -------------

  const arrayEnergy = [];
  const arrayEnergyPositions = [];
  for (let i = 0; i < 4; i++) {
    let randomPositionX = 0;
    let randomPositionY = 0;
    let regenerate = true;
    while (regenerate) {
      randomPositionX = Math.floor(Math.random() * 10) * 10 + 6;
      randomPositionY = Math.floor(Math.random() * 10) * 10 + 2;
      regenerate = false;
      // for (let j = 0; j < arrayEnergyPositions.length; j++) {
      //    const last = arrayEnergyPositions[j];
      for (const last of arrayEnergyPositions) {
        if (last.x === randomPositionX && last.y === randomPositionY ||
          !Builder.getTileTagsAt(randomPositionX, randomPositionY).has('-station-wall-front')) {
          regenerate = true;
          break;
        }
      }
    }
    arrayEnergyPositions.push({ x: randomPositionX, y: randomPositionY });

    arrayEnergy.push(new SimpleGameObject({x: randomPositionX, y: randomPositionY}, {
      texture: {
        atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
        items: {
          [DefaultTileStates.MAIN]: [[17, 3]],
        }
      },
      mutableTags: [DefaultTags.OBSTACLE]
    }));
  }
  for (let j = 0; j < arrayEnergy.length; j++) {
    Builder.addGameObject(arrayEnergy[j]);
    console.log('start');
    console.log(arrayEnergy[j].position.x, arrayEnergy[j].position.y);
  }


// ---------  player  -------------
  const player = new GenericPlayer({x: 3, y: 3}, {
      skin: 'link',
      defaultLightSources: [
        {radius: 3, brightness: 1},
      ],

      initialRotation: Direction.RIGHT,
      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 15
    }
  );
  Builder.setPlayer(player);

  // ---------- logic ---------------

};

