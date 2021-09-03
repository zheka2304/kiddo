import {GameObjectBase} from './game-object-base';
import {Coords} from '../../common/entities';
import {InGameConsoleModel} from '../models/in-game-console-model';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GenericGameObject} from '../entities/generic-game-object';
import {DefaultTags} from '../entities/default-tags.enum';
import {InGameConsoleService} from '../services/in-game-console.service';
import {InGameConsoleWindow} from './in-game-console-window';


interface ConsoleGameObjectTerminalCallbacks {
  onOpen?: (model: InGameConsoleModel) => void;
  onClose?: (model: InGameConsoleModel) => void;
  onInput?: (model: InGameConsoleModel, value: any) => void;
  onOutput?: (model: InGameConsoleModel, value: any, valid: boolean) => void;

  requireInput?: (model: InGameConsoleModel) => any;
  consumeOutput?: (model: InGameConsoleModel, value: any) => boolean;
  onApplied?: (model: InGameConsoleModel, allValid: boolean) => void;

  title?: string;
  enableEcho?: boolean;
  disablePreview?: boolean;
}

export class ConsoleTerminalGameObject extends GameObjectBase {
  private inGameConsoleService: InGameConsoleService = new InGameConsoleService();

  private model: InGameConsoleModel = null;
  private isApplied = false;
  private isOpen = false;

  constructor(
    position: Coords,
    private callbacks: ConsoleGameObjectTerminalCallbacks
  ) {
    super(position);
    this.addImmutableTag(DefaultTags.INTERACTIVE);
    this.addImmutableTag(DefaultTags.CONSOLE);

    this.model = {
      onOpen: () => {
        this.isOpen = true;
        this.isApplied = false;
        if (this.callbacks?.onOpen) {
          this.callbacks.onOpen(this.model);
        }
      },

      onClose: () => {
        this.isOpen = false;
        this.applyIfRequired();
        if (this.callbacks?.onClose) {
          this.callbacks.onClose(this.model);
        }
      },

      onInput: (value: any) => {
        if (this.callbacks?.onInput) {
          this.callbacks.onInput(this.model, value);
        }
        if (this.callbacks?.enableEcho) {
          this.model.lines.push('IN -> ' + InGameConsoleWindow.valueToString(value));
        }
      },

      onOutput: (value: any, valid: boolean) => {
        if (this.callbacks?.onOutput) {
          this.callbacks.onOutput(this.model, value, valid);
        }
        if (this.callbacks?.enableEcho) {
          this.model.lines.push('!{' + (valid ? 'white' : 'red') + '}OUT <- ' + InGameConsoleWindow.valueToString(value));
        }
      },

      requireInput: () => {
        if (this.callbacks?.requireInput) {
          return this.callbacks.requireInput(this.model);
        }
        return null;
      },

      consumeOutput: (value: any) => {
        if (this.callbacks?.consumeOutput) {
          return this.callbacks.consumeOutput(this.model, value);
        }
        return true;
      },

      lines: [],
      inputs: [],
      outputs: [],

      title: this.callbacks?.title || 'CONSOLE',
      allowInputPreview: !this.callbacks?.disablePreview
    };
  }

  private applyIfRequired(): void {
    if (!this.isApplied && this.callbacks?.onApplied) {
      this.callbacks.onApplied(
        this.model,
        this.model.outputs.reduce((prev, curr) => prev && curr.valid, true)
      );
      this.isApplied = true;
    }
  }

  onInteract(writer: GenericWriterService, interactingObject: GenericGameObject): boolean {
    if (interactingObject.getTags().has(DefaultTags.PLAYER)) {
      if (!this.isOpen) {
        this.inGameConsoleService.open(this.model);
      }
      return true;
    }
    return false;
  }
}
