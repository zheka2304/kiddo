import {InGameWindowBase} from './in-game-window-base';
import {GenericSceneRenderContext} from '../../../../app/scene/generic-scene/render/generic-scene-render-context';
import {InGameWindowState} from '../entities/in-game-window';
import {InGameConsoleModel} from '../models/in-game-console-model';
import {GenericWriterService} from '../writers/generic-writer.service';
import {Rect} from '../../../../app/shared/interfaces/rect';
import {InGameConsoleWriterService} from '../writers/in-game-console-writer.service';
import {type} from 'os';


interface InGameConsoleWindowParams {
  borderWidth: number;
  borderLineWidth: number;
  bgColor: string;
  fgColor: string;
  errColor: string;
  title: string;
  textScale: number;
  minLines: number;
  incrementLines: number;
}

export class InGameConsoleWindow extends InGameWindowBase {
  private inGameConsoleWriter = new InGameConsoleWriterService();

  constructor(
    private model: InGameConsoleModel
  ) {
    super();
  }

  public static valueToString(value: any): string {
    if (typeof(value) === 'string') {
      // @ts-ignore
      return '"' + value.replaceAll('\n', '\\n') + '"';
    } else if (typeof(value) === 'object') {
      return JSON.stringify(value);
    } else {
      return '' + value;
    }
  }


  draw(
    context: GenericSceneRenderContext,
    canvas: CanvasRenderingContext2D,
    state: InGameWindowState,
    renderParams: { width: number; height: number; interpolation: number }
  ): void {
    const windowParams: InGameConsoleWindowParams = {
      bgColor: '#1e1e1e',
      fgColor: 'white',
      errColor: 'red',
      borderWidth: 20,
      borderLineWidth: 4,
      title: (this.model.title || 'CONSOLE').toUpperCase(),
      minLines: 16,
      incrementLines: 4,
      textScale: 0.6
    };

    const sizeMultiplier = Math.pow(this.getSizeMultiplier(state, renderParams.interpolation), 0.5) * 0.9;
    const windowRect = this.getWindowRect(renderParams, sizeMultiplier);
    const insidesRect = this.drawWindowBackgroundAndBorder(canvas, windowRect, renderParams, windowParams);
    if (!insidesRect) {
      return;
    }

    this.drawIOStack(canvas, insidesRect, renderParams, windowParams);
    this.drawText(canvas, insidesRect, renderParams, windowParams);
  }

  private drawWindowBackgroundAndBorder(
    canvas: CanvasRenderingContext2D,
    windowRect: Rect,
    renderParams: { width: number; height: number; interpolation: number },
    windowParams: InGameConsoleWindowParams,
  ): Rect {
    const { borderWidth } = windowParams;

    // check available size
    const minWindowSize = borderWidth * 3;
    if (windowRect.width < minWindowSize || windowRect.height < minWindowSize) {
      return null;
    }

    // draw background
    canvas.fillStyle = windowParams.bgColor;
    canvas.fillRect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);

    // draw border
    canvas.strokeStyle = windowParams.fgColor;
    canvas.lineWidth = windowParams.borderLineWidth;
    canvas.strokeRect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);
    canvas.strokeRect(
      windowRect.x + borderWidth,
      windowRect.y + borderWidth,
      windowRect.width - borderWidth * 2,
      windowRect.height - borderWidth * 2
    );

    // draw title
    const title = windowParams.title;
    canvas.font = `${borderWidth}px generic-scene-font`;
    const titleMeasure = canvas.measureText(title);
    if (titleMeasure.width + borderWidth * 2 < windowRect.width) {
      canvas.fillRect(
        (renderParams.width - titleMeasure.width - borderWidth) / 2,
        windowRect.y - 2, titleMeasure.width + borderWidth,
        borderWidth + windowParams.borderLineWidth + 1
      );
      canvas.textAlign = 'center';
      canvas.fillStyle = windowParams.fgColor;
      canvas.fillText(title, renderParams.width / 2, windowRect.y + borderWidth);
    }

    // return inside rect
    const insidesPadding = borderWidth + windowParams.borderLineWidth * 2.5;
    return {
      x: windowRect.x + insidesPadding,
      y: windowRect.y + insidesPadding,
      width: windowRect.width - insidesPadding * 2,
      height: windowRect.height - insidesPadding * 2
    };
  }

  private getLineCount(windowRect: Rect, windowParams: InGameConsoleWindowParams): number {
    const lines = this.model.lines;
    return 3 + Math.max(windowParams.minLines, Math.ceil(lines.length / windowParams.incrementLines) * windowParams.incrementLines);
  }

  private drawIOStack(
    canvas: CanvasRenderingContext2D,
    windowRect: Rect,
    renderParams: { width: number; height: number; interpolation: number },
    windowParams: InGameConsoleWindowParams
  ): void {
    const lineCount = this.getLineCount(windowRect, windowParams);
    const lineHeight = windowRect.height / lineCount;
    canvas.font = `${Math.floor(lineHeight * windowParams.textScale)}px generic-scene-font`;
    canvas.textAlign = 'start';

    let index = 0;
    let inputsStr = ' IN:';
    while (index < 32) {
      if (this.model.inputs.length <= index && this.model.allowInputPreview) {
        this.inGameConsoleWriter.addNextInput(this.model);
      }
      if (this.model.inputs.length <= index) {
        break;
      }
      const value = this.model.inputs[index++];
      const nextInputStr = inputsStr + ' ' + InGameConsoleWindow.valueToString(value);
      if (canvas.measureText(nextInputStr).width < windowRect.width) {
        inputsStr = nextInputStr;
      } else {
        inputsStr = nextInputStr;
        while (canvas.measureText(inputsStr).width > windowRect.width) {
          inputsStr = inputsStr.substr(0, inputsStr.length - 1);
        }
        break;
      }
    }

    const outputsStrPrefix = ' OUT: ';
    let outputsStr = this.model.outputs.map(v => InGameConsoleWindow.valueToString(v.value)).join(' ');
    if (canvas.measureText(outputsStrPrefix + outputsStr).width > windowRect.width) {
      while (canvas.measureText(outputsStrPrefix + outputsStr).width > windowRect.width) {
        outputsStr = outputsStr.substr(1);
      }
      outputsStr = outputsStrPrefix + outputsStr;
    } else {
      outputsStr = outputsStrPrefix + outputsStr;
    }

    canvas.fillText(inputsStr, windowRect.x, windowRect.y + lineHeight);
    canvas.fillText(outputsStr, windowRect.x, windowRect.y + lineHeight * 2);

    canvas.lineWidth = windowParams.borderLineWidth;
    canvas.strokeStyle = windowParams.fgColor;
    canvas.strokeRect(windowRect.x, windowRect.y + lineHeight * 2.75, windowRect.width, 0);
  }

  private drawText(
    canvas: CanvasRenderingContext2D,
    windowRect: Rect,
    renderParams: { width: number; height: number; interpolation: number },
    windowParams: InGameConsoleWindowParams
  ): void {
    const lines = this.model.lines;
    const lineCount = this.getLineCount(windowRect, windowParams);
    const lineHeight = windowRect.height / lineCount;

    canvas.font = `${Math.floor(lineHeight * windowParams.textScale)}px generic-scene-font`;
    canvas.textAlign = 'start';

    // start with 4th line, first 3 are occupied by IO
    let lineIndex = 3;
    for (let line of lines) {
      let color = 'white';
      if (line.startsWith('!{')) {
        const closingBrace = line.indexOf('}');
        color = line.substr(2, closingBrace - 2);
        line = line.substr(closingBrace + 1);
      }
      line = ' ' + line;
      while (canvas.measureText(line).width > windowRect.width) {
        if (line.length >= 4) {
          line = line.substr(0, line.length - 4);
        } else {
          line = '';
          break;
        }
      }

      canvas.fillStyle = color;
      canvas.fillText(line, windowRect.x, windowRect.y + lineHeight * (lineIndex + 1));
      lineIndex++;
    }
  }


  onTick(writer: GenericWriterService): void {
  }

}
