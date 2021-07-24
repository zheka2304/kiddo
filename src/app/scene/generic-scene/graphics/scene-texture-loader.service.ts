import {CanvasTexture} from './canvas-texture';
import {Rect} from '../../../shared/interfaces/rect';
import {AnimatedCanvasTextureRegion, CanvasTextureRegion} from './canvas-texture-region';
import {Injectable} from '@angular/core';
import {environment} from '../../../../environments/environment';
import {DrawableCollection} from './drawable-collection';
import {Drawable} from "./drawable";


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
      src: string,
      atlasX: number, atlasY: number, atlasWidth: number, atlasHeight: number
  ): Promise<CanvasTextureRegion> {
    return await this.getTextureRegion(src, {
      x: atlasX / atlasWidth,
      y: atlasY / atlasHeight,
      width: 1 / atlasWidth,
      height: 1 / atlasHeight
    });
  }

  async getAnimatedTextureItem(
    atlas: { src: string, width: number, height: number },
    atlasItems: number[][],
    fps: number
  ): Promise<AnimatedCanvasTextureRegion> {
    const frames: CanvasTextureRegion[] = [];
    for (const atlasItem of atlasItems) {
      if (atlasItem.length === 4) {
        for (let y = atlasItem[2]; y <= atlasItem[3]; y++) {
          for (let x = atlasItem[0]; x <= atlasItem[1]; x++) {
            frames.push(await this.getTextureAtlasItem(atlas.src, x, y, atlas.width, atlas.height));
          }
        }
      } else if (atlasItem.length === 2) {
        frames.push(await this.getTextureAtlasItem(atlas.src, atlasItem[0], atlasItem[1], atlas.width, atlas.height));
      } else {
        throw new Error('invalid atlas item declared: ' + JSON.stringify(atlasItem));
      }
    }
    return new AnimatedCanvasTextureRegion(frames, fps);
  }

  async getTextureCollectionFromAtlas(
    atlas: { src: string, width: number, height: number },
    data: { [key: string]: number[][] },
    fps: number
  ): Promise<DrawableCollection> {
    const drawableMap = new Map<string, Drawable>();
    for (const name in data) {
      if (data.hasOwnProperty(name)) {
        drawableMap.set(name, await this.getAnimatedTextureItem(atlas, data[name], fps));
      }
    }
    return new DrawableCollection(drawableMap);
  }
}
