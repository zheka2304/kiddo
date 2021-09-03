/* tslint:disable:no-bitwise */
import {Drawable} from './drawable';
import {Rect} from '../../../shared/interfaces/rect';
import {Coords} from '../../../../app-engine/scene/common/entities';
import {GenericReaderService} from '../../../../app-engine/scene/generic/readers/generic-reader.service';
import {GenericGridCell} from '../../../../app-engine/scene/generic/entities/generic-grid-field';


export enum ConnectedTextureFormatType {
  // default CT layout: 2x2 outer edges, 2x2 inner edges, 2x2 randomized full tiles,
  // full tiles are only used, when all neighbours are present
  DEFAULT = 'default',

  // same as default, but uses randomized full tile textures, even as fragments of non-full tiles
  RANDOMIZED = 'randomized',

  // ignores 2x2 texture, uses outer edges center as a full tile one
  LIGHTWEIGHT = 'lightweight',

  // uses only first 2x2 texture as full tile texture for randomization
  FULL_ONLY = 'full_only',

  // uses both first and second 2x2 texture as full tile texture for randomization
  FULL_ONLY2 = 'full_only2',
}

export class ConnectedTextureRegion implements Drawable {
  constructor(
    private type: ConnectedTextureFormatType,
    private outsideEdges: Drawable,
    private insideEdges: Drawable,
    private fullTile: Drawable,
  ) {

  }

  private mulberry32rng(a: number): number {
    let t = a + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  private getFullTileOffset(position: Coords): Coords {
    const x = Math.floor(this.mulberry32rng(position.x + position.y * 112323 + 1231171) * 1.5) * 0.5;
    const y = Math.floor(this.mulberry32rng(position.x + position.y * 412356 + 221317) * 1.5) * 0.5;
    return { x, y };
  }

  private drawFullTile(canvas: CanvasRenderingContext2D, targetRect: Rect, position: Coords): void {
    const dstRegion = {x: 0, y: 0, width: 1, height: 1};
    if (this.type === ConnectedTextureFormatType.LIGHTWEIGHT) {
      this.outsideEdges.draw(canvas, targetRect, {subRegion: {x: 0.25, y: 0.25, width: 0.5, height: 0.5}, dstRegion});
    } else {
      const tile = this.getFullTileOffset(position);
      if (this.type === ConnectedTextureFormatType.FULL_ONLY) {
        this.outsideEdges.draw(canvas, targetRect, {subRegion: {x: tile.x, y: tile.y, width: 0.5, height: 0.5}, dstRegion});
      } else if (this.type === ConnectedTextureFormatType.FULL_ONLY2) {
        const texture = this.mulberry32rng(position.x + position.y * 12131 + 21011) > 0.5 ? this.insideEdges : this.outsideEdges;
        texture.draw(canvas, targetRect, {subRegion: {x: tile.x, y: tile.y, width: 0.5, height: 0.5}, dstRegion});
      } else {
        this.fullTile.draw(canvas, targetRect, {subRegion: {x: tile.x, y: tile.y, width: 0.5, height: 0.5}, dstRegion});
      }
    }
  }

  private drawTopLeft(canvas: CanvasRenderingContext2D, targetRect: Rect, neighbors: number, position: Coords): void {
    neighbors &= 0xC1;
    const dstRegion = { x: 0, y: 0, width: 0.5, height: 0.5 };
    if (neighbors === 0 || neighbors === 0x80) { // no neighbors, or only diagonal one, draw outer corner
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0, y: 0, width: 0.25, height: 0.25 }, dstRegion });
    } else if (neighbors === 0xC1) { // all neighbors, draw full tile fragment
      if (this.type === ConnectedTextureFormatType.RANDOMIZED) {
        const tile = this.getFullTileOffset(position);
        this.fullTile.draw(canvas, targetRect, {subRegion: {x: tile.x, y: tile.y, width: 0.25, height: 0.25}, dstRegion});
      } else {
        this.outsideEdges.draw(canvas, targetRect, {subRegion: {x: 0.5, y: 0.5, width: 0.25, height: 0.25}, dstRegion});
      }
    } else if (neighbors === 0x41) { // all neighbours, except diagonal one, draw inner corner
      this.insideEdges.draw(canvas, targetRect, { subRegion: { x: 0.5, y: 0.5, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 1) === 0) { // top is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.5, y: 0, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 64) === 0) { // left is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0, y: 0.5, width: 0.25, height: 0.25 }, dstRegion });
    }
  }

  private drawTopRight(canvas: CanvasRenderingContext2D, targetRect: Rect, neighbors: number, position: Coords): void {
    neighbors &= 0x07;
    const dstRegion = { x: 0.5, y: 0, width: 0.5, height: 0.5 };
    if (neighbors === 0 || neighbors === 0x02) { // no neighbors, or only diagonal one, draw outer corner
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.75, y: 0, width: 0.25, height: 0.25 }, dstRegion });
    } else if (neighbors === 0x07) { // all neighbors, draw full tile fragment
      if (this.type === ConnectedTextureFormatType.RANDOMIZED) {
        const tile = this.getFullTileOffset(position);
        this.fullTile.draw(canvas, targetRect, {subRegion: {x: tile.x + .25, y: tile.y, width: 0.25, height: 0.25}, dstRegion});
      } else {
        this.outsideEdges.draw(canvas, targetRect, {subRegion: {x: 0.25, y: 0.5, width: 0.25, height: 0.25}, dstRegion});
      }
    } else if (neighbors === 0x05) { // all neighbours, except diagonal one, draw inner corner
      this.insideEdges.draw(canvas, targetRect, { subRegion: { x: 0.25, y: 0.5, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 1) === 0) { // top is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.25, y: 0, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 4) === 0) { // right is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.75, y: 0.5, width: 0.25, height: 0.25 }, dstRegion });
    }
  }

  private drawBottomRight(canvas: CanvasRenderingContext2D, targetRect: Rect, neighbors: number, position: Coords): void {
    neighbors &= 0x1C;
    const dstRegion = { x: 0.5, y: 0.5, width: 0.5, height: 0.5 };
    if (neighbors === 0 || neighbors === 0x08) { // no neighbors, or only diagonal one, draw outer corner
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.75, y: 0.75, width: 0.25, height: 0.25 }, dstRegion });
    } else if (neighbors === 0x1C) { // all neighbors, draw full tile fragment
      if (this.type === ConnectedTextureFormatType.RANDOMIZED) {
        const tile = this.getFullTileOffset(position);
        this.fullTile.draw(canvas, targetRect, {subRegion: {x: tile.x + .25, y: tile.y + .25, width: 0.25, height: 0.25}, dstRegion});
      } else {
        this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 }, dstRegion });
      }
    } else if (neighbors === 0x14) { // all neighbours, except diagonal one, draw inner corner
      this.insideEdges.draw(canvas, targetRect, { subRegion: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 16) === 0) { // bottom is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.25, y: 0.75, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 4) === 0) { // right is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.75, y: 0.25, width: 0.25, height: 0.25 }, dstRegion });
    }
  }

  private drawBottomLeft(canvas: CanvasRenderingContext2D, targetRect: Rect, neighbors: number, position: Coords): void {
    neighbors &= 0x70;
    const dstRegion = { x: 0, y: 0.5, width: 0.5, height: 0.5 };
    if (neighbors === 0 || neighbors === 0x20) { // no neighbors, or only diagonal one, draw outer corner
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0, y: 0.75, width: 0.25, height: 0.25 }, dstRegion });
    } else if (neighbors === 0x70) { // all neighbors, draw full tile fragment
      if (this.type === ConnectedTextureFormatType.RANDOMIZED) {
        const tile = this.getFullTileOffset(position);
        this.fullTile.draw(canvas, targetRect, {subRegion: {x: tile.x + .25, y: tile.y + .25, width: 0.25, height: 0.25}, dstRegion});
      } else {
        this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.5, y: 0.25, width: 0.25, height: 0.25 }, dstRegion });
      }
    } else if (neighbors === 0x50) { // all neighbours, except diagonal one, draw inner corner
      this.insideEdges.draw(canvas, targetRect, { subRegion: { x: 0.5, y: 0.25, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 16) === 0) { // bottom is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0.5, y: 0.75, width: 0.25, height: 0.25 }, dstRegion });
    } else if ((neighbors & 64) === 0) { // left is empty
      this.outsideEdges.draw(canvas, targetRect, { subRegion: { x: 0, y: 0.25, width: 0.25, height: 0.25 }, dstRegion });
    }
  }

  draw(canvas: CanvasRenderingContext2D, targetRect: Rect, extra?: { [p: string]: any }): void {
    // bit positions by neighbor
    // 7 0 1
    // 6   2
    // 5 4 3
    let neighbors = extra?.neighbors as number;
    const position = (extra.position as Coords) || { x: 0, y: 0 };

    if (this.type === ConnectedTextureFormatType.FULL_ONLY || this.type === ConnectedTextureFormatType.FULL_ONLY2) {
      this.drawFullTile(canvas, targetRect, position);
      return;
    }

    if (neighbors === undefined) {
      const reader = extra?.reader as GenericReaderService;
      const checkConnected = extra?.checkConnected as (cell: GenericGridCell) => boolean;
      if (reader && checkConnected) {
        neighbors = 0;
        if (checkConnected(reader.getCellAt(position.x, position.y - 1))) neighbors |= 1;
        if (checkConnected(reader.getCellAt(position.x + 1, position.y - 1))) neighbors |= 2;
        if (checkConnected(reader.getCellAt(position.x + 1, position.y))) neighbors |= 4;
        if (checkConnected(reader.getCellAt(position.x + 1, position.y + 1))) neighbors |= 8;
        if (checkConnected(reader.getCellAt(position.x, position.y + 1))) neighbors |= 16;
        if (checkConnected(reader.getCellAt(position.x - 1, position.y + 1))) neighbors |= 32;
        if (checkConnected(reader.getCellAt(position.x - 1, position.y))) neighbors |= 64;
        if (checkConnected(reader.getCellAt(position.x - 1, position.y - 1))) neighbors |= 128;
      } else {
        return;
      }
    }

    // full tile
    if (neighbors === 0xFF) {
      this.drawFullTile(canvas, targetRect, position);
      return;
    }

    this.drawTopLeft(canvas, targetRect, neighbors, position);
    this.drawTopRight(canvas, targetRect, neighbors, position);
    this.drawBottomRight(canvas, targetRect, neighbors, position);
    this.drawBottomLeft(canvas, targetRect, neighbors, position);
  }
}
