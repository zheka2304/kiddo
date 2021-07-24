import {Rect} from '../../../shared/interfaces/rect';
import {Drawable} from './drawable';


export class CanvasTextureRegion implements Drawable {
  constructor(
    public image: HTMLImageElement,
    public region: Rect
  ) {
  }

  draw(canvas: CanvasRenderingContext2D, targetRect: Rect): void {
    canvas.drawImage(
      this.image,
      this.region.x * this.image.width + 0.01,
      this.region.y * this.image.height + 0.01,
      this.region.width * this.image.width - 0.02,
      this.region.height * this.image.height - 0.02,
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

  draw(canvas: CanvasRenderingContext2D, targetRect: Rect): void {
    const frame = Math.floor((Date.now() - this.animationOffset) / this.millisecondsPerFrame);
    this.frames[frame % this.frames.length].draw(canvas, targetRect);
  }
}
