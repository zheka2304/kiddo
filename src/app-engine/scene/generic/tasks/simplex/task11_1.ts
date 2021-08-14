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
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };


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
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-station-wall-connect']),
    immutableTags: [DefaultTags.OBSTACLE, '-station-wall-connect']
  });

  TileRegistry.addBasicTile('station-wall-front', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.DEFAULT, offset: [[14, 2]]}
      }
    },
    ctCheckConnected: DefaultCTLogic.ANY_TAGS(['-station-wall-front-connect']),
    immutableTags: [DefaultTags.OBSTACLE, '-station-wall-front-connect']
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
    tilesPerScreen: 40
  });

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

        const console = new SimpleGameObject({x: 3 + ox, y: 1 + oy}, {
          texture: {
            atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
            items: {
              [DefaultTileStates.MAIN]: [[16, 3]],
            }
          },
          immutableTags: [DefaultTags.ITEM, 'console'],
          item: {ignoreObstacle: true}
        });

        Builder.addGameObject(console);

        Builder.addGameObject(new ConsoleTerminalGameObject({x: 3 + ox, y: 1 + oy}, {
          enableEcho: true,
        }));

      }
    }
  };

  // Builder.getTileTagsAt(x, y).has('-station-floor');

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
        // for ( let x = 0; x < 7; x ++) {
        //   for (let y = 0; y < 7; y ++) {
        //     Builder.setTile(x + i, y + j, 'moon-stone');
        //     if ((x + y) % 2 === 0) {
        //       Builder.setTile(x + i, y + j, 'moon-stone-decoration', true);
        //     }
        //   }
        // }
         if (Math.random() < 0.7 || i === 0 && j === 0) {
           generateRoom(i + 1, j + 1);
        }
      }
    }
  }

  let offsetY = 5;
  while (offsetY < 101) {
    for (let x = 10; x < 101; x += 10) {
      if (Math.random() < 1 ) {
         if (Builder.getTileTagsAt(x + 2, offsetY).has('-station-floor') && Builder.getTileTagsAt(x - 2, offsetY).has('-station-floor')) {
           const door = new SimpleGameObject({x, y: offsetY}, {
             texture: {
               atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
               items: {
                 close: [[16, 2]],
                 open: [[17, 2]],
               }
             },
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
           const door = new SimpleGameObject({x : offsetX, y: y + 2}, {
             texture: {
               atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
               items: {
                 close: [[16, 2]],
                 open: [[17, 2]],
               }
             },
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
  const console = new SimpleGameObject({x: 3, y: 1}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: [[16, 3]],
      }
    },
    immutableTags: [DefaultTags.ITEM, 'console'],
    item: {ignoreObstacle: true}
  });
  // Builder.addGameObject(console);

  const door = new SimpleGameObject({x: 5, y: 1}, {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        close: [[16, 2]],
        open: [[17, 2]],
      }
    },
    initialState: 'close',
  });
  //Builder.addGameObject(door);

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

};
// ---------- logic ---------------

