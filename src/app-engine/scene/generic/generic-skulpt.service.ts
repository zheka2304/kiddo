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


@Singleton
export class GenericSkulptService implements SceneSkulptService {
  executionWasAborted = false;
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
        this.throwErrorIfScriptIsStopped();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.throwErrorIfScriptIsStopped();
        }
      },

      go: async (turns: number = 1) => {
        this.throwErrorIfScriptIsStopped();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.throwErrorIfScriptIsStopped();
          this.getPlayer().go();
        }
      },

      right: async (turns: number = 1) => {
        this.throwErrorIfScriptIsStopped();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.throwErrorIfScriptIsStopped();
          this.getPlayer().turn(Direction.RIGHT);
        }
      },

      left: async (turns: number = 1) => {
        this.throwErrorIfScriptIsStopped();
        for (let i = 0; i < turns; i++) {
          await this.writer.awaitNextStep();
          this.throwErrorIfScriptIsStopped();
          this.getPlayer().turn(Direction.LEFT);
        }
      },

      look: async (x: number, y: number) => {
        this.throwErrorIfScriptIsStopped();
        await this.writer.awaitNextStep();
        this.throwErrorIfScriptIsStopped();

        const player = this.getPlayer();
        return [ ...this.reader.getAllTagsAt(x + player.position.x, y + player.position.y, [player]) ];
      }
    });
  }

  onExecutionStarted(): void {
    const timePerFrame = 250;
    this.writer.reset(timePerFrame);
    interval(timePerFrame).pipe(
      takeUntil(this.tickingIsStopped),
      tap(_ => {
        this.writer.doGameStep();
        if (this.executionWasAborted) {
          this.tickingIsStopped.next();
        }
      }),
    ).subscribe();
  }

  onExecutionFinished(): void {
    this.tickingIsStopped.next();
  }

  private throwErrorIfScriptIsStopped(): void {
    if (this.executionWasAborted) {
      throw new GameFailError('SCRIPT_STOPPED');
    }
  }
}
