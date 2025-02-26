import { Adaptor } from "./utils/adaptorHelper";

export type WorkflowJson = {
  workflow: {
    name?: string;
    steps: Array<{
      id: string;
      name?: string;
      adaptor: string;
      adaptors: string[];
      state: Record<string, any>;
      expression: string;
    }>;
  };
};

export type WorkflowData = {
  name?: string;
  steps: Array<{
    id: string;
    name?: string;
    adaptor: Adaptor[];
    state: Record<string, any>;
    expression: string;
    filePath: string;
  }>;
  filePath: string; // also serves as an ID
};
