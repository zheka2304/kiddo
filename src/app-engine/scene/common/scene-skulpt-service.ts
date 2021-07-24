export interface SceneSkulptService {
  executionWasAborted: boolean;
  addApiToSkulpt(): void;

  onExecutionStarted?(): void;
  onExecutionFinished?(): void;
}
