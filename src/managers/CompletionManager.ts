import * as vscode from "vscode";
import {
  tsCompleteHelp,
  tsHoverHelp,
  tsSignatureHelp,
} from "../tsSupport/tsLangSupport";

export class CompletionManager implements vscode.Disposable {
  completion: vscode.Disposable | undefined;
  hover: vscode.Disposable | undefined;
  signature: vscode.Disposable | undefined;
  constructor() {}

  async registerCompletions(adaptor: string) {
    if (this.completion) this.completion.dispose();
    this.completion = vscode.languages.registerCompletionItemProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideCompletionItems: async (document, position, token, context) => {
          return await tsCompleteHelp(document, position, adaptor);
        },
      },
      "."
    );
  }

  async registerHoverSupport(adaptor: string) {
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

  async registerSignatureHelpProvider(adaptor: string) {
    this.signature = vscode.languages.registerSignatureHelpProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        async provideSignatureHelp(document, position, token, context) {
          return await tsSignatureHelp(document, position, adaptor);
        },
      },
      {
        triggerCharacters: ["(", ","],
        retriggerCharacters: [")"],
      }
    );
  }

  dispose() {
    if (this.completion) this.completion.dispose();
    if (this.hover) this.hover.dispose();
    if (this.signature) this.signature.dispose();
  }
}
