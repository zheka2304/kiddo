import {SceneWriter} from '../../common/writers/scene.writer';
import {Singleton} from '../../../singleton.decorator';
import {SceneModelService} from '../../scene-model.service';
import {GenericSceneModel} from '../models/generic-scene-model';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericGameObject} from '../entities/generic-game-object';


@Singleton
export class GenericWriterService implements SceneWriter {
  public sceneModel: GenericSceneModel;
  private queue: ((writer: GenericWriterService) => void)[] = [];

  private timePerFrame = 500;
  private lastFrameTime = 0;

  constructor(
    private sceneModelService: SceneModelService,
    private reader: GenericReaderService
  ) {
  }

  init(): void {
    this.sceneModel = this.sceneModelService.sceneModel as GenericSceneModel;
  }

  reset(timePerFrame: number): void {
    this.timePerFrame = timePerFrame;
    this.queue = [];
  }

  doLightMapUpdates(context: GenericSceneRenderContext, interpolation: number): void {
    // reset light
    for (const cell of this.sceneModel.field.grid) {
      cell.light.level = cell.light.ambient;
    }

    // do update
    for (const gameObject of this.sceneModel.gameObjects) {
      gameObject.onLightMapUpdate(
        this, context ? context.getInterpolatedPosition(gameObject.lastPosition, gameObject.position, interpolation) : gameObject.position
      );
    }
  }

  doGameStep(): void {
    this.lastFrameTime = Date.now();

    // run ligh map update, separated from renderer
    this.doLightMapUpdates(null, 0);

    // pre tick stage
    for (const gameObject of this.sceneModel.gameObjects) {
      gameObject.onTick(this);
    }

    // copy required to run only actions, that were added before this step,
    // actions, added in other actions will always run on next step
    for (const action of [ ...this.queue ]) {
      if (action) {
        action(this);
      }
    }

    // post tick stage
    for (const gameObject of this.sceneModel.gameObjects) {
      gameObject.onPostTick(this);
    }
  }

  postAction(action: () => void): void {
    this.queue.push(action);
  }

  async awaitNextStep(): Promise<void> {
    return new Promise<void>(resolve => this.postAction(resolve));
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
}
