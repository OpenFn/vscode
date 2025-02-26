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

  async registerCompletions(adaptor: Adaptor) {
    if (this.completion) this.completion.dispose();
    this.completion = vscode.languages.registerCompletionItemProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideCompletionItems(document, position, token, context) {
          return tsCompleteHelp(document, position, adaptor);
        },
      },
      "."
    );
  }

  async registerHoverSupport(adaptor: Adaptor) {
    if (this.hover) this.hover.dispose();
    this.hover = vscode.languages.registerHoverProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideHover(document, position, token) {
          return tsHoverHelp(document, position, adaptor);
        },
      }
    );
  }

  async registerSignatureHelpProvider(adaptor: Adaptor) {
    if (this.signature) this.signature.dispose();
    this.signature = vscode.languages.registerSignatureHelpProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideSignatureHelp(document, position, token, context) {
          return tsSignatureHelp(document, position, adaptor);
        },
      },
      {
        triggerCharacters: ["(", ","],
        retriggerCharacters: [")"],
      }
    );
  }

  async registerDefinitionHelp(adaptor: Adaptor) {
    if (this.definition) this.definition.dispose();
    this.definition = vscode.languages.registerDefinitionProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideDefinition(document, position, token) {
          return tsFindDefinition(document, position, adaptor);
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
