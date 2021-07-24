import {GenericSceneRenderer} from './generic-scene-renderer';
import {SceneTextureLoaderService} from '../graphics/scene-texture-loader.service';
import {Rect} from '../../../shared/interfaces/rect';
import {Coords} from '../../../../app-engine/scene/common/entities';

export class GenericSceneRenderContext {
  private renderer: GenericSceneRenderer = null;
  private isRendererInitialized = false;
  private isFirstFrame = false;

  private bufferCanvasElement: HTMLCanvasElement = null;
  private staticCanvasElement: HTMLCanvasElement = null;
  private canvasSize: {width: number, height: number} = { width: 0, height: 0 };

  constructor(
    private textureLoaderService: SceneTextureLoaderService,
    private outputCanvasElement: HTMLCanvasElement
  ) {
    this.canvasSize = this.outputCanvasElement.getBoundingClientRect();
    this.outputCanvasElement.width = this.canvasSize.width;
    this.outputCanvasElement.height = this.canvasSize.height;

    this.bufferCanvasElement = document.createElement('canvas');
    this.bufferCanvasElement.width = this.canvasSize.width;
    this.bufferCanvasElement.height = this.canvasSize.height;
    this.bufferCanvasElement.style['image-rendering']  = 'pixelated';

    this.staticCanvasElement = document.createElement('canvas');
    this.staticCanvasElement.style['image-rendering']  = 'pixelated';
  }

  setRenderer(renderer: GenericSceneRenderer): void {
    this.renderer = renderer;
    this.isFirstFrame = true;
  }

  private onStaticDraw(viewport: Rect): void {
    if (this.renderer) {
      const { width, height } = this.renderer.getBackgroundSize(viewport);
      this.staticCanvasElement.width = width;
      this.staticCanvasElement.height = height;
      this.renderer.onStaticDraw(this, this.staticCanvasElement.getContext('2d'), viewport);
    }
  }

  private onResize(): void {
    if (this.renderer) {
      this.renderer.onOutputResize(this, this.canvasSize.width, this.canvasSize.height);
    }
  }

  frame(): void {
    // on the first frame run init & redraw background
    if (this.isFirstFrame) {
      this.isFirstFrame = false;
      this.isRendererInitialized = false;
      if (this.renderer) {
        this.renderer.onInit(this).then(() => {
          this.isRendererInitialized = true;
          // this.onStaticDraw(this.renderer.getViewport(this, this.canvasSize.width, this.canvasSize.height));
        });
      }
    }

    // check for the size change
    const {width, height} = this.outputCanvasElement.getBoundingClientRect();
    if (width !== this.canvasSize.width || height !== this.canvasSize.height) {
      this.canvasSize = {width, height};
      this.outputCanvasElement.width = width;
      this.outputCanvasElement.height = height;
      this.bufferCanvasElement.width = width;
      this.bufferCanvasElement.height = height;
      this.onResize();
    }

    // abort if canvas is not visible
    if (this.canvasSize.width < 1 || this.canvasSize.height < 1) {
      return;
    }

    // get viewport based on current canvas size
    const viewport = this.renderer.getViewport(this, this.canvasSize.width, this.canvasSize.height);

    // if background is dirty, redraw it
    if (this.renderer && this.isRendererInitialized && this.renderer.isBackgroundDirty(viewport)) {
      this.onStaticDraw(viewport);
    }

    // render
    if (this.renderer && this.isRendererInitialized) {
      const bufferCanvasContext = this.bufferCanvasElement.getContext('2d');

      // draw background
      bufferCanvasContext.drawImage(
        this.staticCanvasElement,
        viewport.x, viewport.y, viewport.width, viewport.height,
        0, 0, this.bufferCanvasElement.width, this.bufferCanvasElement.height
      );

      // draw foreground
      this.renderer.onForegroundDraw(this, this.bufferCanvasElement.getContext('2d'), viewport);

      // double buffer
      this.outputCanvasElement.getContext('2d').drawImage(this.bufferCanvasElement, 0, 0, width, height);
    } else {
      const ctx = this.outputCanvasElement.getContext('2d');
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = `48px generic-scene-font`;
      ctx.textAlign = 'center';
      ctx.fillText('Loading...', width / 2, height / 2);
    }
  }


  // util functions

  public getTextureLoader(): SceneTextureLoaderService {
    return this.textureLoaderService;
  }

  public getInterpolatedPosition(lastPosition: Coords, position: Coords, interpolation: number): Coords {
    return {
      x: position.x * interpolation + lastPosition.x * (1 - interpolation),
      y: position.y * interpolation + lastPosition.y * (1 - interpolation),
    };
  }

  public renderDataAndPositionToRect(
    lastPosition: Coords,
    position: Coords,
    renderData: { x: number, y: number, scale: number, interpolation: number },
  ): Rect {
    const interpolatedPosition = this.getInterpolatedPosition(lastPosition, position, renderData.interpolation);
    return {
      x: interpolatedPosition.x * renderData.scale + renderData.x,
      y: interpolatedPosition.y * renderData.scale + renderData.y,
      width: renderData.scale,
      height: renderData.scale
    };
  }
}
