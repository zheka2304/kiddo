import {SceneSkulptService} from '../common/scene-skulpt-service';
import {Singleton} from '../../singleton.decorator';
import {SkulptService} from '../../script-runner/skulpt.service';
import {GenericReaderService} from './readers/generic-reader.service';
import {GenericWriterService} from './writers/generic-writer.service';
import {interval, Subject} from 'rxjs';
import {takeUntil, tap} from 'rxjs/operators';
import {GameFailError} from '../common/errors';
import {GenericPlayer} from './common/player';
import {Direction} from '../common/entities';
import {TerminalService} from '../../../app/code-editor/terminal/terminal.service';
import {GameCompletionInterruptError} from '../common/errors/game-completion-interrupt-error';
import {InGameConsoleService} from './services/in-game-console.service';
import {InGameWindowService} from './services/in-game-window-service';


@Singleton
export class GenericSkulptService implements SceneSkulptService {
  executionWasAborted = false;
  private tickExecutionError: Error = null;
  private tickingIsStopped = new Subject<any>();

  private inGameWindowService: InGameWindowService = new InGameWindowService();
  private inGameConsoleService: InGameConsoleService = new InGameConsoleService();

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
      direction: () => {
        return this.getPlayer().direction.toLowerCase();
      },

      wait: async (turns: number) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
        }
      },

      move: async (turns: number = 1) => {
        let steps = 0;
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          if (this.getPlayer().move(this.reader, { x: 0, y: 1 })) {
            steps++;
          } else {
            break;
          }
        }
        return steps;
      },

      right: async (turns: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          this.getPlayer().turn(this.reader, Direction.RIGHT);
        }
      },

      left: async (turns: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.checkRunFailedCompletedOrAborted();
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          this.getPlayer().turn(this.reader, Direction.LEFT);
        }
      },

      inspect: async (x: number = 0, y: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitNextStep();
        this.checkRunFailedCompletedOrAborted();
        const player = this.getPlayer();
        if (!player.validateInspectOffset({ x, y })) {
          throw new GameFailError('INVALID_PLAYER_INSPECT_OFFSET');
        }
        return [ ...player.getAllTagsRelativeToPlayer(this.reader, { x, y }, [player], true) ];
      },

      look: async (tag: string, range: number) => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitNextStep();
        this.checkRunFailedCompletedOrAborted();
        const player = this.getPlayer();
        if (!player.validateLookRange(range)) {
          throw new GameFailError('INVALID_PLAYER_LOOK_RANGE');
        }
        return player.lookForCellsWithTag(this.reader, tag, range, true).map(coords => [ coords.x, coords.y ]);
      },

      interact: async (x: number, y: number) => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitNextStep();
        this.checkRunFailedCompletedOrAborted();
        const player = this.getPlayer();
        if (!player.validateInteractOffset({ x, y })) {
          throw new GameFailError('INVALID_PLAYER_INTERACT_OFFSET');
        }
        return player.interact(this.writer, { x, y }, [player], true) != null;
      }
    });

    injector.addModule('console', {
      output: async (value: any) => {
        // do not wait for next step, because it is just print and has no impact on a game
        this.checkRunFailedCompletedOrAborted();
        const model = this.inGameConsoleService.getCurrentModel();
        if (!model) {
          throw new GameFailError('CONSOLE_NOT_OPEN');
        }
        this.inGameConsoleService.getWriter().printToConsole(model, value + '');
      },

      has_more: () => {
        this.checkRunFailedCompletedOrAborted();
        const model = this.inGameConsoleService.getCurrentModel();
        if (!model) {
          throw new GameFailError('CONSOLE_NOT_OPEN');
        }
        return this.inGameConsoleService.getWriter().addNextInput(model);
      },

      read: async () => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitNextStep();
        this.checkRunFailedCompletedOrAborted();
        const model = this.inGameConsoleService.getCurrentModel();
        if (!model) {
          throw new GameFailError('CONSOLE_NOT_OPEN');
        }
        return this.inGameConsoleService.getWriter().readNextInput(model);
      },

      write: async (value: any) => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitNextStep();
        this.checkRunFailedCompletedOrAborted();
        const model = this.inGameConsoleService.getCurrentModel();
        if (!model) {
          throw new GameFailError('CONSOLE_NOT_OPEN');
        }
        this.inGameConsoleService.getWriter().addNextOutput(model, value);
      },

      close: async () => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitNextStep();
        this.checkRunFailedCompletedOrAborted();
        this.inGameConsoleService.close();
      }
    });
  }

  onExecutionStarted(): void {
    const timePerFrame = 500;
    this.writer.reset(timePerFrame);
    this.inGameWindowService.closeAllWindows();
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
    this.inGameWindowService.closeAllWindows();
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
