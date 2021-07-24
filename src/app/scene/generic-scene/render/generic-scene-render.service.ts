import {Injectable} from '@angular/core';
import {GenericSceneRenderContext} from './generic-scene-render-context';
import {BehaviorSubject, interval} from 'rxjs';
import {switchMap, takeWhile, tap} from 'rxjs/operators';
import {SceneTextureLoaderService} from "../graphics/scene-texture-loader.service";


@Injectable({
  providedIn: 'root'
})
export class GenericSceneRenderService {
  private aaa = new BehaviorSubject(true);

  private framePlayback = interval(20).pipe(
    tap(_ => this.frame())
  );

  constructor(
    private textureLoaderService: SceneTextureLoaderService
  ) {
    this.framePlayback.subscribe();
  }

  private activeContexts: Set<GenericSceneRenderContext> = new Set<GenericSceneRenderContext>();

  createRenderContext(canvasElement: HTMLCanvasElement): GenericSceneRenderContext {
    const context = new GenericSceneRenderContext(
      this.textureLoaderService,
      canvasElement
    );
    this.activeContexts.add(context);
    return context;
  }

  destroyRenderContext(context: GenericSceneRenderContext): void {
    this.activeContexts.delete(context);
  }

  private frame(): void {
    this.activeContexts.forEach(ctx => ctx.frame());
  }
}
