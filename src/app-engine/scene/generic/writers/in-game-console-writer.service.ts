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
    const input = model.inputs.length > 0 ? model.inputs.shift() : model.requireInput();
    if (input != null && model.onInput) {
      model.onInput(input);
    }
    return input;
  }

  addNextOutput(model: InGameConsoleModel, value: any): boolean {
    const valid = model.consumeOutput(value);
    model.outputs.push({ valid, value });
    if (model.onOutput) {
      model.onOutput(value, valid);
    }
    return valid;
  }
}
