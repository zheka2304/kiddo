import {Singleton} from '../../../singleton.decorator';
import {InGameConsoleModel} from '../models/in-game-console-model';


@Singleton
export class InGameConsoleWriterService {
  addNextInput(model: InGameConsoleModel): boolean {
    const next = model.requireInput();
    if (next != null) {
      model.inputs.push(next);
      return true;
    } else {
      return false;
    }
  }

  printToConsole(model: InGameConsoleModel, line: string): void {
    model.lines.push(line);
  }

  readNextInput(model: InGameConsoleModel): any {
    if (model.inputs.length > 0) {
      return model.inputs.shift();
    }
    return model.requireInput();
  }

  addNextOutput(model: InGameConsoleModel, value: any): boolean {
    const valid = model.consumeOutput(value);
    model.outputs.push({ valid, value });
    return valid;
  }
}
