import {CanvasTexture} from './canvas-texture';
import {Rect} from '../../../shared/interfaces/rect';
import {AnimatedCanvasTextureRegion, CanvasTextureRegion} from './canvas-texture-region';
import {Injectable} from '@angular/core';
import {environment} from '../../../../environments/environment';
import {DrawableCollection} from './drawable-collection';
import {Drawable} from './drawable';


export interface TextureAtlasSource {
  src: string;
  width: number;
  height: number;
}

export interface TextureAtlasItemCollection {
  atlas: TextureAtlasSource;
  items: {[key: string]: number[][]};
  fps?: number;
}


@Injectable({
  providedIn: 'root'
})
export class SceneTextureLoaderService {
  private textures = new Map<string, CanvasTexture>();
  private sourceAliases = new Map<string, string>();

  constructor() {
  }

  addAlias(name: string, src: string): void {
    this.sourceAliases.set(name, src);
  }

  async getTextureRegion(src: string, region: Rect): Promise<CanvasTextureRegion> {
    src = src.replace('assets:', environment.assetsPath + '/images');
    src = this.sourceAliases.get(src) || src;
    let texture = this.textures.get(src);
    if (!texture) {
      texture = new CanvasTexture(src);
      this.textures.set(src, texture);
    }
    return new CanvasTextureRegion(await texture.getImage(), region);
  }

  async getTextureAtlasItem(
      atlas: TextureAtlasSource,
      atlasX: number, atlasY: number
  ): Promise<CanvasTextureRegion> {
    return await this.getTextureRegion(atlas.src, {
      x: atlasX / atlas.width,
      y: atlasY / atlas.height,
      width: 1 / atlas.width,
      height: 1 / atlas.height
    });
  }

  async getAnimatedTextureItem(
    atlas: TextureAtlasSource,
    atlasItems: number[][],
    fps: number
  ): Promise<AnimatedCanvasTextureRegion> {
    const frames: CanvasTextureRegion[] = [];
    for (const atlasItem of atlasItems) {
      if (atlasItem.length === 4) {
        for (let y = atlasItem[2]; y <= atlasItem[3]; y++) {
          for (let x = atlasItem[0]; x <= atlasItem[1]; x++) {
            frames.push(await this.getTextureAtlasItem(atlas, x, y));
          }
        }
      } else if (atlasItem.length === 2) {
        frames.push(await this.getTextureAtlasItem(atlas, atlasItem[0], atlasItem[1]));
      } else {
        throw new Error('invalid atlas item declared: ' + JSON.stringify(atlasItem));
      }
    }
    return new AnimatedCanvasTextureRegion(frames, fps);
  }

  async getTextureCollectionFromAtlas(
    data: TextureAtlasItemCollection
  ): Promise<DrawableCollection> {
    const drawableMap = new Map<string, Drawable>();
    for (const name in data.items) {
      if (data.items.hasOwnProperty(name)) {
        drawableMap.set(name, await this.getAnimatedTextureItem(data.atlas, data.items[name], data.fps || 1));
      }
    }
    return new DrawableCollection(drawableMap);
  }
}
