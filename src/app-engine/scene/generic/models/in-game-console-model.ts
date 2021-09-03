export interface InGameConsoleModel {
  requireInput: () => any;
  consumeOutput: (value: any) => boolean;

  onInput?: (value: any) => void;
  onOutput?: (value: any, correct: boolean) => void;
  onOpen?: () => void;
  onClose?: () => void;

  inputs: any[];
  outputs: ({value: any, valid: boolean})[];
  lines: string[];

  title: string;
  allowInputPreview: boolean;
}
