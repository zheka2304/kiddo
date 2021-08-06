import {SceneSkulptService} from '../common/scene-skulpt-service';
import {Singleton} from '../../singleton.decorator';
import {SkulptService} from '../../script-runner/skulpt.service';
import {GenericReaderService} from './readers/generic-reader.service';
import {GenericWriterService} from './writers/generic-writer.service';
import {GameFailError} from '../common/errors';
import {GenericPlayer} from './common/player';
import {Direction} from '../common/entities';
import {TerminalService} from '../../../app/code-editor/terminal/terminal.service';
import {GameCompletionInterruptError} from '../common/errors/game-completion-interrupt-error';
import {InGameConsoleService} from './services/in-game-console.service';
import {InGameWindowService} from './services/in-game-window-service';
import {GenericSceneExecutor, GenericSceneExecutorService} from './generic-scene-executor.service';


@Singleton
export class GenericSkulptService implements SceneSkulptService {
  executionWasAborted = false;
  private sceneRuntimeError: Error = null;
  private executor: GenericSceneExecutor = null;

  private sceneExecutorService: GenericSceneExecutorService = new GenericSceneExecutorService();
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
      get_direction: () => {
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
          // we use this instead of awaitNextStep, because move must execute synchronously during the game tick
          // and await writer.awaitNextTurn() will run in async, so it will change player position after the tick is complete,
          // messing up all calculations
          if (!await this.writer.awaitPostAction(() => {
            this.checkRunFailedCompletedOrAborted();
            if (this.inGameConsoleService.getCurrentModel()) {
              throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
            }
            if (this.getPlayer().move(this.reader, { x: 0, y: 1 })) {
              steps++;
              return true;
            } else {
              return false;
            }
          })) {
            break;
          }
        }
        return steps;
      },

      right: async (turns: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitPostAction(() => {
            this.checkRunFailedCompletedOrAborted();
            if (this.inGameConsoleService.getCurrentModel()) {
              throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
            }
            this.getPlayer().turn(this.reader, Direction.RIGHT);
          });
        }
      },

      left: async (turns: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitPostAction(() => {
            this.checkRunFailedCompletedOrAborted();
            if (this.inGameConsoleService.getCurrentModel()) {
              throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
            }
            this.getPlayer().turn(this.reader, Direction.LEFT);
          });
        }
      },

      inspect: async (x: number = 0, y: number = 1) => {
        this.checkRunFailedCompletedOrAborted();
        return await this.writer.awaitPostAction(() => {
          this.checkRunFailedCompletedOrAborted();
          const player = this.getPlayer();
          if (!player.validateInspectOffset({x, y})) {
            throw new GameFailError('INVALID_PLAYER_INSPECT_OFFSET');
          }
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          return [...player.getAllTagsRelativeToPlayer(this.reader, {x, y}, [player], true)];
        });
      },

      look: async (tag: string, range: number) => {
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitPostAction(() => {
          this.checkRunFailedCompletedOrAborted();
          const player = this.getPlayer();
          if (!player.validateLookRange(range)) {
            throw new GameFailError('INVALID_PLAYER_LOOK_RANGE');
          }
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          return player.lookForCellsWithTag(this.reader, tag, range, true).map(coords => [coords.x, coords.y]);
        });
      },

      interact: async (x: number, y: number) => {
        this.checkRunFailedCompletedOrAborted();
        return await this.writer.awaitPostAction(() => {
          this.checkRunFailedCompletedOrAborted();
          const player = this.getPlayer();
          if (!player.validateInteractOffset({x, y})) {
            throw new GameFailError('INVALID_PLAYER_INTERACT_OFFSET');
          }
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          return player.interact(this.writer, {x, y}, [player], true) != null;
        });
      },

      pickup: async (tags: string | string[], x: number, y: number) => {
        if (!Array.isArray(tags)) {
          tags = [ tags as string ];
        }
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitPostAction(() => {
          this.checkRunFailedCompletedOrAborted();
          const player = this.getPlayer();
          if (!player.validateInteractOffset({x, y})) {
            throw new GameFailError('INVALID_PLAYER_INTERACT_OFFSET');
          }
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          return !!player.pickItemRelative(this.writer, {x, y}, tags as string[], true);
        });
      },

      place: async (tags: string | string[], x: number, y: number) => {
        if (!Array.isArray(tags)) {
          tags = [ tags as string ];
        }
        this.checkRunFailedCompletedOrAborted();
        await this.writer.awaitPostAction(() => {
          this.checkRunFailedCompletedOrAborted();
          const player = this.getPlayer();
          if (!player.validateInteractOffset({x, y})) {
            throw new GameFailError('INVALID_PLAYER_INTERACT_OFFSET');
          }
          if (this.inGameConsoleService.getCurrentModel()) {
            throw new GameFailError('PLAYER_MOVE_WITH_OPEN_CONSOLE');
          }
          return player.placeItemRelative(this.writer, {x, y}, player.findItemsInInventory(tags as string[])[0], true);
        });
      },

      has_item: (tags: string | string[]) => {
        if (!Array.isArray(tags)) {
          tags = [ tags as string ];
        }
        return this.getPlayer().findItemsInInventory(tags as string[]).length > 0;
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
        return this.inGameConsoleService.getWriter().hasMoreInputs(model);
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
    this.writer.reset();
    this.executor = this.sceneExecutorService.createExecutor(this.writer, this, () => this.executionWasAborted);
    this.executor.runLoop(this.sceneExecutorService.getPreferredTimePerTick()).then();
  }

  onExecutionFinished(): void {
    this.executor.stop().then();
    this.inGameWindowService.closeAllWindows();
  }

  public handleSceneRuntimeError(err: Error): void {
    console.error('error in generic scene runtime', err);
    this.sceneRuntimeError = err;
  }

  private checkRunFailedCompletedOrAborted(): void {
    if (this.sceneRuntimeError) {
      throw this.sceneRuntimeError;
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
