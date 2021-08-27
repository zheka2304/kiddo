import {Singleton} from '../../../singleton.decorator';
import {TextureAtlasItemCollection} from '../../../../app/scene/generic-scene/graphics/scene-texture-loader.service';
import {Direction} from '../../common/entities';


export interface CharacterSkin {
  name?: string;
  idleTexture?: TextureAtlasItemCollection;
  walkingTexture?: TextureAtlasItemCollection;
}

@Singleton
export class CharacterSkinRegistryService {
  private skinMap = new Map<string, CharacterSkin>();

  constructor() {
    this.registerBuiltInSkins();
  }

  addCharacterSkin(name: string, skin: CharacterSkin): void {
    this.skinMap.set(name, { ...skin, name });
  }

  getCharacterSkin(skinOrName: CharacterSkin | string): CharacterSkin {
    if (typeof(skinOrName) === 'string') {
      return this.skinMap.get(skinOrName as string);
    } else {
      return skinOrName as CharacterSkin;
    }
  }

  getWalkingTextureDescription(skinOrName: CharacterSkin | string): TextureAtlasItemCollection {
    const skin = this.getCharacterSkin(skinOrName);
    return skin?.walkingTexture || skin?.idleTexture || { atlas: { src: 'none', width: 1, height: 1 }, items: {} };
  }

  getIdleTextureDescription(skinOrName: CharacterSkin | string): TextureAtlasItemCollection {
    const skin = this.getCharacterSkin(skinOrName);
    return skin?.idleTexture || skin?.walkingTexture || { atlas: { src: 'none', width: 1, height: 1 }, items: {} };
  }


  //
  private registerBuiltInSkins(): void {
    this.addCharacterSkin('link', {
      idleTexture: {
        atlas: {src: 'assets:/character-atlas-link.png', width: 10, height: 8},
        items: {
          [Direction.DOWN]: [[0, 0]],
          [Direction.UP]: [[0, 2]],
          [Direction.LEFT]: [[0, 1]],
          [Direction.RIGHT]: [[0, 3]],
        }
      },
      walkingTexture: {
        atlas: {src: 'assets:/character-atlas-link.png', width: 10, height: 8},
        items: {
          [Direction.DOWN]: [[0, 9, 4, 4]],
          [Direction.UP]: [[0, 9, 6, 6]],
          [Direction.LEFT]: [[0, 9, 5, 5]],
          [Direction.RIGHT]: [[0, 9, 7, 7]],
        },
        fps: 12
      }
    });

    this.addCharacterSkin('alexey', {
      idleTexture: {
        atlas: {src: 'assets:/character-atlas-alexey.png', width: 10, height: 8},
        items: {
          [Direction.DOWN]: [[0, 0]],
          [Direction.UP]: [[0, 2]],
          [Direction.LEFT]: [[0, 1]],
          [Direction.RIGHT]: [[0, 3]],
        }
      },
      walkingTexture: {
        atlas: {src: 'assets:/character-atlas-alexey.png', width: 10, height: 8},
        items: {
          [Direction.DOWN]: [[0, 9, 4, 4]],
          [Direction.UP]: [[0, 9, 6, 6]],
          [Direction.LEFT]: [[0, 9, 5, 5]],
          [Direction.RIGHT]: [[0, 9, 7, 7]],
        },
        fps: 12
      }
    });

    this.addCharacterSkin('kadabra', {
      idleTexture: {
        atlas: {src: 'assets:/character-atlas-kadabra.png', width: 4, height: 8},
        items: {
          [Direction.DOWN]: [[0, 0]],
          [Direction.UP]: [[0, 2]],
          [Direction.LEFT]: [[0, 3]],
          [Direction.RIGHT]: [[0, 1]],
        }
      },
      walkingTexture: {
        atlas: {src: 'assets:/character-atlas-kadabra.png', width: 4, height: 8},
        items: {
          [Direction.DOWN]: [[0, 3, 4, 4]],
          [Direction.UP]: [[0, 3, 6, 6]],
          [Direction.LEFT]: [[0, 3, 7, 7]],
          [Direction.RIGHT]: [[0, 3, 5, 5]],
        },
        fps: 6
      }
    });

    this.addCharacterSkin('parrot', {
      walkingTexture: {
        atlas: {src: 'assets:/character-atlas-parrot.png', width: 3, height: 4},
        items: {
          [Direction.DOWN]: [[0, 2, 0, 0]],
          [Direction.UP]: [[0, 2, 2, 2]],
          [Direction.LEFT]: [[0, 2, 3, 3]],
          [Direction.RIGHT]: [[0, 2, 1, 1]],
        },
        fps: 6
      }
    });
  }
}
