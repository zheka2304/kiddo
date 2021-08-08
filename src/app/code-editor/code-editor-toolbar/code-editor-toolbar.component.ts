import {Component, OnInit, ViewChild} from '@angular/core';
import {GoogleAnalyticsService, ScenePositionService} from '../../shared/services';
import {CodeEditorService} from '../code-editor-service/code-editor.service';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {CodeSaverService} from '../code-saver/code-saver.service';
import {ModalDirective} from '../../shared/directives/modal/modal.directive';
import {ScriptRunnerService} from '../../../app-engine/script-runner/script-runner.service';
import {TerminalService} from '../terminal/terminal.service';
import {SnackbarDirective} from '../../shared/directives/snackbar/snackbar.directive';
import {scriptExecutionState} from '../../../app-engine/script-runner/script-runner.types';
import {SceneModelService} from '../../../app-engine/scene/scene-model.service';
import {SceneAccessorsService} from '../../../app-engine/scene/scene-accessors.service';
import {environment} from 'src/environments/environment';
import {ConfigurationService} from 'src/app/config/configuration.service';
import {GenericSkulptService} from '../../../app-engine/scene/generic/generic-skulpt.service';
import {
  GenericSceneExecutor,
  GenericSceneExecutorService,
  GenericSceneExecutorState
} from '../../../app-engine/scene/generic/generic-scene-executor.service';
import {GenericWriterService} from '../../../app-engine/scene/generic/writers/generic-writer.service';
import {GenericSceneModel} from '../../../app-engine/scene/generic/models/generic-scene-model';

@Component({
  selector: 'kiddo-code-editor-toolbar',
  templateUrl: './code-editor-toolbar.component.html',
  styleUrls: ['./code-editor-toolbar.component.scss']
})
export class CodeEditorToolbarComponent implements OnInit {

  saveErrorMessage: string;
  hideLangSelectionDropdown = false;

  prefixTooltip = 'CODE-EDITOR.TOOLTIP.';
  prefixOptions = 'CODE-EDITOR.OPTIONS.';
  prefixButton = 'CODE-EDITOR.BUTTON.';
  prefixModal = 'CODE-EDITOR.MODAL.';
  prefixSnackbar = 'CODE-EDITOR.SNACKBAR.';
  playbackIsLaunched = this.scriptRunnerService.playbackIsRunning;
  launchButtonState = this.scriptRunnerService.executionState
    .pipe(
      map(state => {
        if (state === scriptExecutionState.READY) return 'play';
        if (state === scriptExecutionState.RUNNING) return 'stop';
        if (state === scriptExecutionState.FINISHING) return 'stopping';
        if (state === scriptExecutionState.FINISHED) return 'replay';
      })
    );

  debugToolsExpanded = false;
  preferredExecutionSpeedIndex = 0;

  waitingForManualInterrupt = false;
  waitingForResume = false;
  waitingForSpeedChange = false;

  @ViewChild('initialCodeModal') initialCodeModal: ModalDirective;
  @ViewChild('saveCodeModal') saveCodeModal: ModalDirective;
  @ViewChild('saveSnackbar') saveSnackbar: SnackbarDirective;
  @ViewChild('helpModal') helpModal: ModalDirective;

  get allLangs(): string[] {
    return this.translateService.getLangs();
  }

  get currentLang(): string {
    return this.translateService.currentLang;
  }

  private sceneModelService: SceneModelService;
  private sceneAccessorsService: SceneAccessorsService;
  private genericExecutorService: GenericSceneExecutorService;

  constructor(
    private codeEditorService: CodeEditorService,
    private scenePositionService: ScenePositionService,
    private translateService: TranslateService,
    private terminalService: TerminalService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private codeSaverService: CodeSaverService,
    private scriptRunnerService: ScriptRunnerService,
    private configService: ConfigurationService
  ) {
    this.sceneModelService = new SceneModelService();
    this.sceneAccessorsService = new SceneAccessorsService();
    this.genericExecutorService = new GenericSceneExecutorService();
  }

  ngOnInit(): void {
    this.codeEditorService.initialize();
    this.hideLangSelectionDropdown = Boolean(this.configService.getLanguageConfiguration().useOnly);
  }

  onLaunchButtonClick(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: launch_click');
    this.launchButtonState.pipe(
      take(1)
    )
      .subscribe(state => {
        // NOTICE! This logic strongly relies on methods naming.
        // It allows one-line solution in change of switch/case or map,
        // but could be broken once the naming changes. So pay attention!
        this[state]();
      });
  }

  getLaunchButtonColor(): Observable<string> {
    const colorsLookup = {
      play: 'green',
      stop: 'red',
      stopping: 'red',
      replay: 'blue',
    };
    return this.launchButtonState.pipe(
      map(state => colorsLookup[state])
    );
  }


  showDebugTools(): boolean {
    return this.sceneAccessorsService.sceneSkulptService instanceof GenericSkulptService;
  }

  private getGenericSceneModel(): GenericSceneModel {
    const writer = this.sceneAccessorsService.writer;
    if (writer instanceof GenericWriterService) {
      return (writer as GenericWriterService).sceneModel;
    }
    return null;
  }

  private getGenericSceneExecutor(): GenericSceneExecutor {
    return this.genericExecutorService.getExecutorFor(this.getGenericSceneModel());
  }

  private changeExecutionSpeed(): void {
    const timePerTickBySpeed = [500, 250, 20, 1000];
    const speedIndex = this.preferredExecutionSpeedIndex;
    const timePerTick = timePerTickBySpeed[speedIndex];
    if (this.waitingForSpeedChange) {
      return;
    }

    this.waitingForSpeedChange = true;
    this.genericExecutorService.setPreferredTimePerTick(timePerTick);
    const executor = this.getGenericSceneExecutor();
    if (executor) {
      if (executor.getState() === GenericSceneExecutorState.RUNNING) {
        executor.runLoop(timePerTick).then(() => {
          this.waitingForSpeedChange = false;
          if (speedIndex !== this.preferredExecutionSpeedIndex) {
            this.changeExecutionSpeed();
          }
        });
      } else {
        // in manual mode update animation duration
        executor.writer.setTimePerFrame(timePerTick);
        this.waitingForSpeedChange = false;
      }
    } else {
      this.waitingForSpeedChange = false;
    }
  }

  onChangeSpeedButtonClick(): void {
    this.preferredExecutionSpeedIndex = (this.preferredExecutionSpeedIndex + 1) % 4;
    this.changeExecutionSpeed();
  }

  getChangeSpeedButtonText(): string {
    const textBySpeed = ['1X', '2X', '25X', '0.5X'];
    return textBySpeed[this.preferredExecutionSpeedIndex];
  }

  disableDebugButton(): Observable<boolean> {
    return this.scriptRunnerService.executionState.pipe(
      map(state => {
        if (this.sceneAccessorsService.sceneSkulptService instanceof GenericSkulptService) {
          return state !== scriptExecutionState.READY && state !== scriptExecutionState.RUNNING;
        }
        return true;
      })
    );
  }

  private playWithManualControl(): void {
    if (this.waitingForManualInterrupt) {
      return;
    }
    this.waitingForManualInterrupt = true;
    this.play();
    const executor = this.getGenericSceneExecutor();
    if (executor) {
      setTimeout(() => executor.interrupt().then(() => this.waitingForManualInterrupt = false), 0);
    }
  }

  onDebugButtonClick(): void {
    const executor = this.getGenericSceneExecutor();
    if (executor && executor.getState() !== GenericSceneExecutorState.IDLE) {
      if (!this.waitingForManualInterrupt) {
        this.waitingForManualInterrupt = true;
        if (executor.getState() === GenericSceneExecutorState.MANUAL) {
          executor.manualStep().then(() => this.waitingForManualInterrupt = false);
        } else {
          executor.interrupt().then(() => this.waitingForManualInterrupt = false);
        }
      }
    } else {
      this.scriptRunnerService.executionState.pipe(
        take(1),
        map(state => {
          if (state === scriptExecutionState.READY) {
            this.playWithManualControl();
          }
        })
      ).subscribe();
    }
  }

  disableResumeButton(): boolean {
    const executor = this.getGenericSceneExecutor();
    return !executor || executor.getState() !== GenericSceneExecutorState.MANUAL;
  }

  onResumeButtonClick(): void {
    const executor = this.getGenericSceneExecutor();
    if (!this.waitingForResume && executor && executor.getState() === GenericSceneExecutorState.MANUAL) {
      this.waitingForResume = true;
      executor.runLoop(this.genericExecutorService.getPreferredTimePerTick()).then(() => this.waitingForResume = false);
    }
  }


  play(): void {
    this.googleAnalyticsService.emitEvent(
      environment.googleAnalytics.events.buttonClick, 'code-editor: run_script_click', this.codeEditorService.userCode
    );
    this.playbackIsLaunched.next(false);
    this.terminalService.open();
    this.scenePositionService.openScene();
    this.scriptRunnerService.runScript(this.codeEditorService.userCode);
  }

  stop(): void {
    this.googleAnalyticsService.emitEvent(
      environment.googleAnalytics.events.buttonClick, 'code-editor: stop_script_click', this.codeEditorService.userCode
    );
    this.scriptRunnerService.stopScript();

    const executor = this.getGenericSceneExecutor();
    if (executor) {
      executor.stop().then();
    }
  }

  replay(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: replay_script_click');
    this.scriptRunnerService.resetScene();
  }

  stopping(): void {
  }

  disableResetButton(): Observable<boolean> {
    return this.scriptRunnerService.executionState.pipe(
      map((state) => {
        return state === scriptExecutionState.RUNNING || state === scriptExecutionState.FINISHING;
      })
    );
  }

  resetApp(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: rerender_app_click');
    this.scriptRunnerService.resetScene();
  }

  onPlaybackClick(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: playback_scene_click');
    this.playbackIsLaunched.pipe(
      take(1)
    )
      .subscribe(
        isLaunched => {
          if (!isLaunched) {
            this.playbackIsLaunched.next(true);
            this.scriptRunnerService.startScenePlayback();
            this.scenePositionService.openScene();
          } else {
            this.playbackIsLaunched.next(false);
            this.scriptRunnerService.stopScenePlayback();
          }
        });
  }

  async onSaveClick(name?: string): Promise<void> {
    try {
      await this.codeSaverService.saveSolution(this.codeEditorService.userCode, name);
      this.saveCodeModal.close();
      this.saveSnackbar.open();
      this.saveErrorMessage = '';
    } catch {
      this.saveErrorMessage = this.prefixModal + 'SAVE_NAME_EXISTS';
    }
  }

  onLoad(code: string): void {
    this.codeEditorService.userCode = code;
  }

  async handleLangChange(lang: string): Promise<void> {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.dropdownClick, 'code-editor: language_change_click');
    lang = lang.toLowerCase();
    this.translateService.use(lang);
    localStorage.setItem('kiddoLanguage', lang);
  }

  onResetCodeClick(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: reset_to_initial_code_click');
    this.codeEditorService.setInitialUserScript();
    this.initialCodeModal.close();
  }

  onOpenModalClick(el: ModalDirective, gaEventAction: string): void {
    if (gaEventAction) {
      this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, `code-editor: ${gaEventAction}`);
    }
    el.open();
  }

  closeSaveCodeModal(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: close_save_modal_click');
    this.saveErrorMessage = '';
    this.saveCodeModal.close();
  }

  setIDELeft(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: set_IDE_left_click');
    this.scenePositionService.setSceneRight();
  }

  setIDERight(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'code-editor: set_IDE_right_click');
    this.scenePositionService.setSceneLeft();
  }

  sceneIsPlaybackable(): boolean {
    return this.sceneAccessorsService.sceneIsPlaybackable;
  }

  sceneHasTaskDescription(): boolean {
    return !!this.sceneModelService.taskDescription;
  }
}
