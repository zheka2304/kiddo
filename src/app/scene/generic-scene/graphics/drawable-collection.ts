import {Drawable} from './drawable';
import {Rect} from '../../../shared/interfaces/rect';


export class DrawableCollection {
  constructor(
    private drawables: Map<string, Drawable>
  ) {
  }

  get(name: string): Drawable {
    return this.drawables.get(name);
  }

  draw(canvas: CanvasRenderingContext2D, name: string, rect: Rect): void {
    const drawable = this.drawables.get(name);
    if (drawable) {
      drawable.draw(canvas, rect);
    }
  }
}
