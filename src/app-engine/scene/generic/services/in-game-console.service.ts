import {Singleton} from '../../../singleton.decorator';
import {InGameConsoleModel} from '../models/in-game-console-model';
import {InGameConsoleWindow} from '../common/in-game-console-window';
import {InGameWindowService} from './in-game-window-service';
import {InGameConsoleWriterService} from '../writers/in-game-console-writer.service';


@Singleton
export class InGameConsoleService {
  private inGameWindowService = new InGameWindowService();
  private writer = new InGameConsoleWriterService();

  private currentConsoleModel: InGameConsoleModel = null;
  private currentConsoleWindow: InGameConsoleWindow = null;

  getWriter(): InGameConsoleWriterService {
    return this.writer;
  }

  getCurrentModel(): InGameConsoleModel {
    return this.currentConsoleModel;
  }

  open(model: InGameConsoleModel): void {
    this.close();
    this.currentConsoleModel = model;
    this.currentConsoleWindow = new InGameConsoleWindow(model);
    this.inGameWindowService.openWindow(this.currentConsoleWindow);
    if (model.onOpen) {
      model.onOpen();
    }
  }

  close(): void {
    if (this.currentConsoleModel) {
      if (this.currentConsoleModel.onClose) {
        this.currentConsoleModel.onClose();
      }
      this.currentConsoleModel = null;
    }
    if (this.currentConsoleWindow) {
      this.inGameWindowService.closeWindow(this.currentConsoleWindow);
      this.currentConsoleWindow = null;
    }
  }
}
