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
import {GenericWriterService} from '../../writers/generic-writer.service';
import {GameObjectBase} from '../../common/game-object-base';
import {ConnectedTextureFormatType} from '../../../../../app/scene/generic-scene/graphics/connected-texture-region';
import {GenericGameObject} from '../../entities/generic-game-object';
import {GenericReaderService} from '../../readers/generic-reader.service';

// declarations for generic task init function
declare const Builder: GenericBuilderService;
declare const TileRegistry: CommonTileRegistryService;
declare const CharacterSkinRegistry: CharacterSkinRegistryService;
declare const InGameConsole: InGameConsoleService;
declare const DefaultCheckingLogic: { [key: string]: CheckingLogic };
declare const DefaultCTLogic: { [key: string]: any };

class Neuron extends SimpleGameObject {
  constructor(position: Coords) {
    super(position, {
      texture: {
        atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
        items: {
          [DefaultTileStates.MAIN]: [[4, 0]],
        }
      },
      immutableTags: [DefaultTags.ITEM, 'neuron'],
    });
  }
}

class Target extends SimpleGameObject {
  constructor(position: Coords) {
    super(position, {
      texture: {
        atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
        items: {
          [DefaultTileStates.MAIN]: [[4, 1]],
        }
      },
      immutableTags: ['target'],
    });
  }
}


// tslint:disable-next-line
export const SimplexTask9_1 = () => {
  CharacterSkinRegistry.addCharacterSkin('nanobot', {
    idleTexture: {
      atlas: {src: 'assets:/character-atlas-nanobot.png', width: 4, height: 1},
      items: {
        [Direction.DOWN]: [[0, 0]],
        [Direction.UP]: [[2, 0]],
        [Direction.LEFT]: [[3, 0]],
        [Direction.RIGHT]: [[1, 0]],
      }
    },
    walkingTexture: {
      atlas: {src: 'assets:/character-atlas-nanobot.png', width: 4, height: 1},
      items: {
        [Direction.DOWN]: [[0, 0]],
        [Direction.UP]: [[2, 0]],
        [Direction.LEFT]: [[3, 0]],
        [Direction.RIGHT]: [[1, 0]],
      }
    }
  });

  // --------- registration -------------

  TileRegistry.addBasicTile('brain-background', {
    texture: {
      atlas: {src: 'assets:/connected-tile-atlas.png', width: 24, height: 16},
      items: {
        [DefaultTileStates.MAIN]: {ctType: ConnectedTextureFormatType.FULL_ONLY, offset: [[0, 0]]}
      }
    },
    immutableTags: []
  });


  // --------- tile generation -------------
  Builder.setupGameField({width: 15, height: 15}, {
    lightMap: {
      enabled: false,
      ambient: 0.09
    },
    tilesPerScreen: 9
  });

  for (let x = 0; x < 15; x++) {
    for (let y = 0; y < 15; y++) {
      Builder.setTile(x, y, 'brain-background');
    }
  }

  // --------- object -------------

  const arrayNeurons = [];
  const neuronPositions = [];
  for (let i = 0; i < 3; i++) {
    let positionX = 0;
    let positionY = 0;
    let regenerate = true;
    while (regenerate) {
      positionX = Math.floor(Math.random() * 13 + 1);
      positionY = Math.floor(Math.random() * 13 + 1);
      regenerate = false;
      for (const last of neuronPositions) {
        if (last[0] === positionX && last[1] === positionY) {
          regenerate = true;
          break;
        }
      }
    }
    neuronPositions.push([positionX, positionY]);
    arrayNeurons.push(new Neuron({x: positionX, y: positionY}));
  }
  for (const neuron of arrayNeurons) {
    Builder.addGameObject(neuron);
  }

  const arrayTargets = [
    new Target({x: 10, y: 3}),
    new Target({x: 10, y: 6}),
    new Target({x: 10, y: 9}),
  ];
  for (const target of arrayTargets) {
    Builder.addGameObject(target);
  }

  // ---------  player  -------------
  const player = new GenericPlayer({x: 3, y: 4}, {
      skin: 'nanobot',
      defaultLightSources: [
        {radius: 3, brightness: 1},
      ],

      initialRotation: Direction.UP,
      minVisibleLightLevel: 0.1,
      interactRange: 1,
      lookRange: 15
    }
  );
  Builder.setPlayer(player);

  // ---------- logic ---------------

  Builder.addCheckingLogic((reader: GenericReaderService) => {
    let levelPassed = false;
    let counter = 0;

    for (let i = 0; i < arrayTargets.length; i++) {
      if (reader.getAllTagsAt(arrayTargets[i].position.x, arrayTargets[i].position.y ).has('neuron')) {
        counter++;
      }
      if (counter === 3) {
        levelPassed = true;
      }
    }
    if (levelPassed) {
      return null;
    } else {
      return 'NOT_ALL_NEURONS_PLACED';
    }
  });
};
