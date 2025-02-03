import * as vscode from "vscode";
import downloadAst from "../utils/downloadAst";
import generateCompletionItems from "../utils/generateCompletionItems";
import generateHoverItem from "../utils/generateHoverInformations";

export class CompletionManager implements vscode.Disposable {
  completion: vscode.Disposable | undefined;
  hover: vscode.Disposable | undefined;
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

  dispose() {
    if (this.completion) this.completion.dispose();
  }
}
