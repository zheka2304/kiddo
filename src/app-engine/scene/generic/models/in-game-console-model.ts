export interface InGameConsoleModel {
  requireInput: () => any;
  consumeOutput: (value: any) => boolean;
  onOpen?: () => void;
  onClose?: () => void;

  inputs: any[];
  outputs: ({value: any, valid: boolean})[];
  lines: string[];

  title: string;
  allowInputPreview: boolean;
}
