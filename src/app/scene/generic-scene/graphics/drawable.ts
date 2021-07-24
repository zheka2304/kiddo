import {Rect} from '../../../shared/interfaces/rect';


export interface Drawable {
  draw(canvas: CanvasRenderingContext2D, targetRect: Rect): void;
}
