import {GenericWriterService} from './writers/generic-writer.service';
import {GenericSceneModel} from './models/generic-scene-model';
import {Singleton} from '../../singleton.decorator';
import {GenericSkulptService} from './generic-skulpt.service';


@Singleton
export class GenericSceneExecutorService {
  private executorBySceneUid = new Map<string, GenericSceneExecutor>();

  public createExecutor(
    writer: GenericWriterService,
    skulptService: GenericSkulptService,
    executionWasAborted: () => boolean = () => false
  ): GenericSceneExecutor {
    if (!writer?.sceneModel) {
      return null;
    }
    const existing = this.getExecutorFor(writer.sceneModel);
    if (existing) {
      existing.stop().then();
    }
    const executor = new GenericSceneExecutor(writer, skulptService, executionWasAborted);
    this.executorBySceneUid.set(writer.sceneModel.sceneUid, executor);
    return executor;
  }

  public destroyExecutor(executor: GenericSceneExecutor): void {
    executor.stop().then();
    this.executorBySceneUid.delete(executor.writer?.sceneModel?.sceneUid);
  }

  public getExecutorFor(sceneModel: GenericSceneModel): GenericSceneExecutor {
    if (!sceneModel) {
      return null;
    }
    return this.executorBySceneUid.get(sceneModel.sceneUid);
  }
}


export enum GenericSceneExecutorState {
  IDLE = 'idle',
  RUNNING = 'running',
  MANUAL = 'manual',
}


export class GenericSceneExecutor {
  private state: GenericSceneExecutorState = GenericSceneExecutorState.IDLE;

  private queuedActions: (() => void)[] = [];
  private isInterrupted = false;

  constructor(
    public writer: GenericWriterService,
    public skulptService: GenericSkulptService,
    private executionWasAborted: () => boolean,
  ) {
  }

  public getState(): GenericSceneExecutorState {
    return this.state;
  }

  public async awaitNextFrame(): Promise<void> {
    return new Promise<void>(resolve => this.queuedActions.push(resolve));
  }

  // interrupt execution, and wait until state will be switched to manual
  // await interrupt() will assure, that executor in manual state
  public async interrupt(): Promise<void> {
    if (this.state === GenericSceneExecutorState.RUNNING) {
      this.isInterrupted = true;
      await this.awaitNextFrame();
    }
  }

  public async stop(): Promise<void> {
    await this.interrupt();
    this.state = GenericSceneExecutorState.IDLE;
    this.doGameStepSafely();
  }

  // do a manual step on a worker thread and await it
  // this will first assure, that executor in manual state, and await interrupt, if required
  public async manualStep(): Promise<void> {
    await this.interrupt();
    return new Promise<void>(resolve => {
      setTimeout(() => {
        this.runGameTick();
        resolve();
      }, 0);
    });
  }

  private runQueuedActions(): void {
    const queuedActions = [ ...this.queuedActions ];
    this.queuedActions = [];
    for (const action of queuedActions) {
      action();
    }
  }

  private doGameStepSafely(): void {
    try {
      this.writer.doGameStep();
    } catch (err) {
      // stop in case of error
      this.state = GenericSceneExecutorState.IDLE;
      this.skulptService.handleSceneRuntimeError(err);

      // this will safely run all queued actions (turn awaits) to stop the script, otherwise it will wait forever
      this.writer.runAllActionsSafely();
    }
  }

  private runGameTick(): boolean {
    // check for interrupt
    if (this.isInterrupted) {
      this.isInterrupted = false;
      this.state = GenericSceneExecutorState.MANUAL;
      this.runQueuedActions();
      return false;
    }

    // do game step
    this.doGameStepSafely();

    // check if execution was aborted
    if (this.executionWasAborted()) {
      this.state = GenericSceneExecutorState.IDLE;
      this.runQueuedActions();
      return false;
    }

    // run queued actions at the end of the frame
    this.runQueuedActions();

    // continue, if still running
    return this.state === GenericSceneExecutorState.RUNNING;
  }

  public async runLoop(timePerFrame: number): Promise<void> {
    await this.interrupt();

    const scheduleNextTick = (timeout: number) => {
      setTimeout(() => {
        const scheduleTime = Date.now() + timePerFrame;
        if (this.runGameTick()) {
          scheduleNextTick(scheduleTime - Date.now());
        }
      }, timeout);
    };

    this.state = GenericSceneExecutorState.RUNNING;
    this.writer.setTickPerFrame(timePerFrame);
    scheduleNextTick(0);
  }
}
