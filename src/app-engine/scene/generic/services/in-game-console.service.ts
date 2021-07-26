import {Singleton} from '../../../singleton.decorator';
import {InGameConsoleModel} from '../models/in-game-console-model';
import {InGameConsoleWindow} from '../common/in-game-console-window';
import {InGameWindowService} from './in-game-window-service';


@Singleton
export class InGameConsoleService {
  private inGameWindowService = new InGameWindowService();

  private currentConsoleModel: InGameConsoleModel = null;
  private currentConsoleWindow: InGameConsoleWindow = null;

  getCurrentModel(): InGameConsoleModel {
    return this.currentConsoleModel;
  }

  open(model: InGameConsoleModel): void {
    this.close();
    this.currentConsoleModel = model;
    this.currentConsoleWindow = new InGameConsoleWindow(model);
    this.inGameWindowService.openWindow(this.currentConsoleWindow);
  }

  close(): void {
    this.currentConsoleModel = null;
    if (this.currentConsoleWindow) {
      this.inGameWindowService.closeWindow(this.currentConsoleWindow);
      this.currentConsoleWindow = null;
    }
  }
}
