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
  private lightMapCanvasElement: HTMLCanvasElement = null;
  private canvasSize: { width: number, height: number } = { width: 0, height: 0 };

  private draggedViewOffset: { x: number, y: number } = { x: 0, y: 0 };
  private draggedViewOffsetLastChange = 0;

  constructor(
    private textureLoaderService: SceneTextureLoaderService,
    private outputCanvasElement: HTMLCanvasElement,
    private outputWrapperElement: HTMLElement
  ) {
    this.canvasSize = this.outputCanvasElement.getBoundingClientRect();
    this.outputCanvasElement.width = this.canvasSize.width;
    this.outputCanvasElement.height = this.canvasSize.height;

    if (!window.requestAnimationFrame) {
      this.bufferCanvasElement = document.createElement('canvas');
      this.bufferCanvasElement.width = this.canvasSize.width;
      this.bufferCanvasElement.height = this.canvasSize.height;
      this.bufferCanvasElement.style['image-rendering'] = 'pixelated';
    } else {
      this.bufferCanvasElement = null;
    }

    this.staticCanvasElement = document.createElement('canvas');
    this.staticCanvasElement.style['image-rendering']  = 'pixelated';
    this.lightMapCanvasElement = document.createElement('canvas');
  }

  setRenderer(renderer: GenericSceneRenderer): void {
    this.renderer = renderer;
    this.isFirstFrame = true;
  }

  public onMouseDrag(x: number, y: number): void {
    this.draggedViewOffset.x -= x;
    this.draggedViewOffset.y -= y;

    const backTimeout = 1000;
    this.draggedViewOffsetLastChange = Date.now();
    const returnBack = () => {
      if (Date.now() >= this.draggedViewOffsetLastChange + backTimeout) {
        let vx = this.draggedViewOffset.x;
        let vy = this.draggedViewOffset.y;
        const d = Math.sqrt(vx * vx + vy * vy);
        if (d > 20) {
          vx /= d / 20;
          vy /= d / 20;
          setTimeout(returnBack, 10);
        }
        this.draggedViewOffset.x -= vx;
        this.draggedViewOffset.y -= vy;
      }
    };
    setTimeout(returnBack, backTimeout);
  }

  private onStaticDraw(viewport: Rect): void {
    if (this.renderer) {
      const { width, height } = this.renderer.getBackgroundSize(viewport);
      this.staticCanvasElement.width = width;
      this.staticCanvasElement.height = height;
      this.renderer.onStaticDraw(this, this.staticCanvasElement.getContext('2d'), viewport);
    }
  }

  private onLightMapDraw(viewport: Rect): void {
    if (this.renderer) {
      const size = this.renderer.getLightMapSize(viewport);
      this.lightMapCanvasElement.width = size.width;
      this.lightMapCanvasElement.height = size.height;
      this.renderer.onLightMapDraw(this, this.lightMapCanvasElement.getContext('2d'), size, viewport);
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
    let { x, y, width, height } = this.outputWrapperElement.getBoundingClientRect();
    // this.outputCanvasElement.style.left = Math.floor(x) + 'px';
    // this.outputCanvasElement.style.top = Math.floor(y) + 'px';
    this.outputCanvasElement.style.width = width + 'px';
    this.outputCanvasElement.style.height = height + 'px';
    width *= devicePixelRatio;
    height *= devicePixelRatio;
    if (width !== this.canvasSize.width || height !== this.canvasSize.height) {
      this.canvasSize = {width, height};
      this.outputCanvasElement.width = width;
      this.outputCanvasElement.height = height;
      if (this.bufferCanvasElement) {
        this.bufferCanvasElement.width = width;
        this.bufferCanvasElement.height = height;
      }
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

    // run light map updates
    if (this.renderer && this.isRendererInitialized && this.renderer.isLightMapEnabled()) {
      this.onLightMapDraw(viewport);
    }

    // render
    if (this.renderer && this.isRendererInitialized) {
      const drawForeground = (canvas: CanvasRenderingContext2D) => {
        canvas.imageSmoothingEnabled = false;

        // draw background
        canvas.drawImage(
          this.staticCanvasElement,
          viewport.x, viewport.y, viewport.width, viewport.height,
          0, 0, width, height
        );

        // draw foreground
        this.renderer.onForegroundDraw(this, canvas, viewport);

        // draw light map
        if (this.renderer.isLightMapEnabled()) {
          canvas.imageSmoothingEnabled = true;
          const scaleX = this.lightMapCanvasElement.width / this.staticCanvasElement.width;
          const scaleY = this.lightMapCanvasElement.height / this.staticCanvasElement.height;
          canvas.globalCompositeOperation = 'multiply';
          canvas.drawImage(
            this.lightMapCanvasElement,
            viewport.x * scaleX, viewport.y * scaleY, viewport.width * scaleX, viewport.height * scaleY,
            0, 0, this.canvasSize.width, this.canvasSize.height
          );
          canvas.globalCompositeOperation = 'normal';
        }

        // draw ui
        this.renderer.onDrawUi(this, canvas, viewport);
      };

      if (window.requestAnimationFrame) {
        // if window.requestAnimationFrame is available, draw directly to output canvas
        window.requestAnimationFrame(() => drawForeground(this.outputCanvasElement.getContext('2d')));
      } else {
        // otherwise double buffer
        drawForeground(this.bufferCanvasElement.getContext('2d'));
        this.outputCanvasElement.getContext('2d').drawImage(this.bufferCanvasElement, 0, 0, width, height);
      }
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


  public getDraggedViewOffset(): Coords {
    return this.draggedViewOffset;
  }

  public setDraggedViewOffset(x: number, y: number): void {
    this.draggedViewOffset.x = x;
    this.draggedViewOffset.y = y;
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
