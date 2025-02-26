import * as vscode from "vscode";
import {
  tsCompleteHelp,
  tsFindDefinition,
  tsHoverHelp,
  tsSignatureHelp,
} from "../tsSupport/tsLangSupport";
import { Adaptor } from "../utils/adaptorHelper";

export class CompletionManager implements vscode.Disposable {
  completion: vscode.Disposable | undefined;
  hover: vscode.Disposable | undefined;
  signature: vscode.Disposable | undefined;
  definition: vscode.Disposable | undefined;
  constructor() {}

  async registerCompletions(adaptors: Adaptor[]) {
    if (this.completion) this.completion.dispose();
    this.completion = vscode.languages.registerCompletionItemProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideCompletionItems(document, position, token, context) {
          return tsCompleteHelp(document, position, adaptors);
        },
      },
      "."
    );
  }

  async registerHoverSupport(adaptors: Adaptor[]) {
    if (this.hover) this.hover.dispose();
    this.hover = vscode.languages.registerHoverProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideHover(document, position, token) {
          return tsHoverHelp(document, position, adaptors);
        },
      }
    );
  }

  async registerSignatureHelpProvider(adaptors: Adaptor[]) {
    if (this.signature) this.signature.dispose();
    this.signature = vscode.languages.registerSignatureHelpProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideSignatureHelp(document, position, token, context) {
          return tsSignatureHelp(document, position, adaptors);
        },
      },
      {
        triggerCharacters: ["(", ","],
        retriggerCharacters: [")"],
      }
    );
  }

  async registerDefinitionHelp(adaptors: Adaptor[]) {
    if (this.definition) this.definition.dispose();
    this.definition = vscode.languages.registerDefinitionProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideDefinition(document, position, token) {
          return tsFindDefinition(document, position, adaptors);
        },
      }
    );
  }

  dispose() {
    if (this.completion) this.completion.dispose();
    if (this.hover) this.hover.dispose();
    if (this.signature) this.signature.dispose();
    if (this.definition) this.definition.dispose();
  }
}
