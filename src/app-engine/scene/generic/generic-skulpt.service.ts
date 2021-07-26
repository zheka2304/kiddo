import {SceneSkulptService} from '../common/scene-skulpt-service';
import {Singleton} from '../../singleton.decorator';
import {SkulptService} from '../../script-runner/skulpt.service';
import {GenericReaderService} from './readers/generic-reader.service';
import {GenericWriterService} from './writers/generic-writer.service';
import {interval, Subject} from 'rxjs';
import {takeUntil, tap} from 'rxjs/operators';
import {GameFailError} from '../common/errors';
import {GenericPlayer, PlayerActionType} from './common/player';
import {Direction} from '../common/entities';
import {TerminalService} from '../../../app/code-editor/terminal/terminal.service';
import {GameCompletionInterruptError} from '../common/errors/game-completion-interrupt-error';


@Singleton
export class GenericSkulptService implements SceneSkulptService {
  executionWasAborted = false;
  private tickExecutionError: Error = null;
  private tickingIsStopped = new Subject<any>();

  constructor(
    private skulptService: SkulptService,
    private terminalService: TerminalService,
    private reader: GenericReaderService,
    private writer: GenericWriterService
  ) {
  }

  private getPlayer(): GenericPlayer {
    return this.writer.sceneModel.player;
  }

  addApiToSkulpt(): void {
    const injector = this.skulptService.getModuleInjector();
    injector.removeAllInjectedModules();

    injector.addModule('debug', {
      output: (...args: any) => {
        const output: string[] = [];
        for (const arg of args) {
          if (typeof arg === 'object') {
            output.push(JSON.stringify(arg));
          } else {
            output.push('' + arg);
          }
        }
        this.terminalService.print(output.join(' '));
      }
    });

    injector.addModule('player', {
      wait: async (turns: number) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
        }
      },

      go: async (turns: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
          this.getPlayer().go(this.reader);
        }
      },

      right: async (turns: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
          this.getPlayer().turn(this.reader, Direction.RIGHT);
        }
      },

      left: async (turns: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
          this.getPlayer().turn(this.reader, Direction.LEFT);
        }
      },

      look: async (x: number, y: number) => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitNextStep();
        this.checkRunFailedCompletedOrAborted();
        const player = this.getPlayer();
        if (!player.validateLookOffset({ x, y })) {
          throw new GameFailError('INVALID_PLAYER_LOOK_OFFSET');
        }
        return [ ...player.getAllTagsRelativeToPlayer(this.reader, { x, y }, [player]) ];
      }
    });
  }

  onExecutionStarted(): void {
    const timePerFrame = 250;
    this.writer.reset(timePerFrame);
    this.tickExecutionError = null;

    interval(timePerFrame).pipe(
      takeUntil(this.tickingIsStopped),
      tap(_ => {
        try {
          this.writer.doGameStep();
        } catch (err) {
          this.executionWasAborted = true;
          this.tickExecutionError = err;
          console.error('error in generic scene runtime', err);

          // this will safely run all queued actions (turn awaits) to stop the script, otherwise it will wait forever
          this.writer.runAllActionsSafely();
        }
        if (this.executionWasAborted) {
          this.tickingIsStopped.next();
        }
      }),
    ).subscribe();
  }

  onExecutionFinished(): void {
    this.tickingIsStopped.next();
  }

  private checkRunFailedCompletedOrAborted(): void {
    if (this.tickExecutionError) {
      throw this.tickExecutionError;
    }
    const player = this.getPlayer();
    if (this.reader.checkLevelCompletedSuccessfully()) {
      throw new GameCompletionInterruptError();
    }
    if (player && player.getFailReason()) {
      throw new GameFailError(player.getFailReason());
    }
    if (this.executionWasAborted) {
      throw new GameFailError('SCRIPT_STOPPED');
    }
  }
}
