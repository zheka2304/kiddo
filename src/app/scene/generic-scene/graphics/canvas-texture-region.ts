import {Rect} from '../../../shared/interfaces/rect';
import {Drawable} from './drawable';


interface CanvasTextureRegionParams {
  subRegion?: Rect;
  dstRegion?: Rect;
}

export class CanvasTextureRegion implements Drawable {
  constructor(
    public image: HTMLImageElement,
    public region: Rect
  ) {
  }

  private cutoutRect(rect: Rect, cutout: Rect, padding: number = 0): Rect {
    return {
      x: rect.x + cutout.x * rect.width + padding,
      y: rect.y + cutout.y * rect.height + padding,
      width: cutout.width * rect.width - padding * 2,
      height: cutout.height * rect.height - padding * 2
    };
  }

  draw(canvas: CanvasRenderingContext2D, targetRect: Rect, params?: CanvasTextureRegionParams): void {
    let region = this.region;
    if (params?.subRegion) {
      region = this.cutoutRect(region, params.subRegion);
      targetRect = this.cutoutRect(targetRect, params.dstRegion || params.subRegion);
    }
    canvas.drawImage(
      this.image,
      region.x * this.image.width,
      region.y * this.image.height,
      region.width * this.image.width,
      region.height * this.image.height,
      targetRect.x, targetRect.y, targetRect.width, targetRect.height,
    );

  }
}


export class AnimatedCanvasTextureRegion implements Drawable {
  private animationOffset = 0;
  private millisecondsPerFrame = 1;

  constructor(
    private frames: CanvasTextureRegion[],
    fps: number
  ) {
    this.millisecondsPerFrame = 1000 / fps || 1;
  }

  restartAnimation(): void {
    this.animationOffset = Date.now();
  }

  draw(canvas: CanvasRenderingContext2D, targetRect: Rect, extra?: { [p: string]: any }): void {
    const frame = Math.floor((Date.now() - this.animationOffset) / this.millisecondsPerFrame);
    this.frames[frame % this.frames.length].draw(canvas, targetRect, extra);
  }
}
