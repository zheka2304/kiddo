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

  addNextOutput(model: InGameConsoleModel, value: any): boolean {
    const valid = model.consumeOutput(value);
    model.outputs.push({ valid, value });
    return valid;
  }
}
