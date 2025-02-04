import * as vscode from "vscode";
import downloadAst from "../utils/downloadAst";
import generateCompletionItems from "../utils/generateCompletionItems";
import generateHoverItem from "../utils/generateHoverInformations";
import generateSignature from "../utils/generateSignature";

export class CompletionManager implements vscode.Disposable {
  completion: vscode.Disposable | undefined;
  hover: vscode.Disposable | undefined;
  signature: vscode.Disposable | undefined;
  constructor() {}

  async registerCompletions(adaptor: string) {
    const ast = await downloadAst(adaptor);
    if (!ast) return;
    if (this.completion) this.completion.dispose();
    this.completion = vscode.languages.registerCompletionItemProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideCompletionItems: (document, position, token, context) => {
          return generateCompletionItems(ast);
        },
      }
    );
  }

  async registerHoverSupport(adaptor: string) {
    const ast = await downloadAst(adaptor);
    if (!ast) return;
    if (this.hover) this.hover.dispose();
    this.hover = vscode.languages.registerHoverProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideHover(document, position, token) {
          const range = document.getWordRangeAtPosition(position);
          const word = document.getText(range);
          return generateHoverItem(ast, word);
        },
      }
    );
  }

  async registerSignatureHelpProvider(adaptor: string) {
    const ast = await downloadAst(adaptor);
    if (!ast) return;
    this.signature = vscode.languages.registerSignatureHelpProvider(
      {
        language: "fn",
        scheme: "file",
      },
      {
        provideSignatureHelp(document, position, token, context) {
          const range = document.getWordRangeAtPosition(position);
          const word = document.getText(range);
          const m = word.match(/^([a-zA-Z_]\w*)\(/); // TODO match nested function calls
          if (m && m[1]) return generateSignature(ast, m[1]);
          return null;
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
  }
}
