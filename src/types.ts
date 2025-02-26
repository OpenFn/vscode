import type { LanguageService } from "typescript";
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
    adaptors: Adaptor[];
    state: Record<string, any>;
    expression: string;
    filePath: string;
  }>;
  filePath: string; // also serves as an ID
};

export interface FnLangHost {
  service: LanguageService;
  adaptorPaths: string[];
}
