import {SceneWriter} from '../../common/writers/scene.writer';
import {Singleton} from '../../../singleton.decorator';
import {SceneModelService} from '../../scene-model.service';
import {GenericSceneModel} from '../models/generic-scene-model';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericGameObject} from '../entities/generic-game-object';
import {InGameWindowService} from '../services/in-game-window-service';


@Singleton
export class GenericWriterService implements SceneWriter {
  public sceneModel: GenericSceneModel;
  private queue: ((writer: GenericWriterService) => void)[] = [];

  private timePerFrame = 500;
  private lastFrameTime = 0;
  private lastUiFrameTime = 0;

  private readonly inGameWindowService = new InGameWindowService();

  constructor(
    private sceneModelService: SceneModelService,
    private reader: GenericReaderService
  ) {
  }

  init(): void {
    this.sceneModel = this.sceneModelService.sceneModel as GenericSceneModel;
  }

  reset(): void {
    this.queue = [];
  }

  setTimePerFrame(timePerFrame: number): void {
    this.timePerFrame = timePerFrame;
  }

  doLightMapUpdates(context: GenericSceneRenderContext, interpolation: number): void {
    // reset light
    for (const cell of this.sceneModel.field.grid) {
      cell.light.level = cell.light.ambient;
      cell.light.color = [ ...cell.light.ambientColor ];
    }

    // do update
    for (const gameObject of this.sceneModel.gameObjects) {
      if (gameObject.onLightMapUpdate) {
        gameObject.onLightMapUpdate(
          this, context ? context.getInterpolatedPosition(gameObject.lastPosition, gameObject.position, interpolation) : gameObject.position
        );
      }
    }
  }

  doGameStep(): void {
    this.lastFrameTime = this.lastUiFrameTime = Date.now();

    // run light map update, separated from renderer
    this.doLightMapUpdates(null, 0);

    // tick in-game windows first, so opening them will not instantly trigger tick and swap states
    this.inGameWindowService.onTick(this);

    // pre tick stage
    for (const gameObject of this.sceneModel.gameObjects) {
      gameObject.onTick(this);
    }

    // copy required to run only actions, that were added before this step,
    // actions, added in other actions will always run on next step
    const queue = [ ...this.queue ];
    this.queue = [];
    for (const action of queue) {
      if (action) {
        action(this);
      }
    }

    // post tick stage
    for (const gameObject of this.sceneModel.gameObjects) {
      gameObject.onPostTick(this);
    }
  }

  runAllActionsSafely(): void {
    const queue = [ ...this.queue ];
    this.queue = [];
    for (const action of queue) {
      if (action) {
        try {
          action(this);
        } catch (err) {
          console.error('error in action ignored: ', err);
        }
      }
    }
  }

  finalizeExecution(gameObjectAnimationTimeout?: number): void {
    // this will safely run all queued actions to stop the script, otherwise it will wait forever
    this.runAllActionsSafely();

    // this will complete last animation and then stop, without this player will do walking animation indefinitely
    setTimeout(() => {
      for (const gameObject of this.sceneModel.gameObjects) {
        gameObject.lastPosition = { ...gameObject.position };
      }
    }, gameObjectAnimationTimeout >= 0 ? gameObjectAnimationTimeout : this.timePerFrame);

    // close all in-game windows with animation
    this.lastUiFrameTime = Date.now();
    this.inGameWindowService.closeAllWindowsWithAnimation(this.timePerFrame);
  }

  postAction(action: () => void): void {
    this.queue.push(action);
  }

  async awaitNextStep(): Promise<void> {
    return new Promise<void>(resolve => this.postAction(resolve));
  }

  async awaitPostAction<T>(action: () => T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.postAction(() => {
        try {
          resolve(action());
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  doPlaybackStep(): void {
    this.doGameStep();
  }


  getReader(): GenericReaderService {
    return this.reader;
  }

  getRenderInterpolationValue(): number {
    return Math.min(1, (Date.now() - this.lastFrameTime) / this.timePerFrame);
  }

  getUiInterpolationValue(): number {
    return Math.min(1, (Date.now() - this.lastUiFrameTime) / this.timePerFrame);
  }


  addGameObject(obj: GenericGameObject): void {
    if (obj) {
      this.sceneModel.gameObjects = [ ...this.sceneModel.gameObjects, obj ];
    }
  }

  removeGameObject(obj: GenericGameObject): void {
    if (obj) {
      this.sceneModel.gameObjects = this.sceneModel.gameObjects.filter(o => o !== obj);
    }
  }

  interact(x: number, y: number, interactingObject: GenericGameObject, exclude?: GenericGameObject[]): GenericGameObject {
    const all = this.reader.getGameObjectsAt(x, y, exclude);
    for (const obj of all) {
      if (obj.onInteract && obj.onInteract(this, interactingObject)) {
        return obj;
      }
    }
    return null;
  }
}
