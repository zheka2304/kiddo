export interface InGameConsoleModel {
  requireInput: () => any;
  consumeOutput: (value: any) => boolean;

  inputs: any[];
  outputs: ({ value: any, valid: boolean})[];
  lines: string[];

  title: string;
  allowInputPreview: boolean;
}
