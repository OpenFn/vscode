import * as vscode from "vscode";
import downloadAst from "../utils/downloadAst";
import generateCompletionItems from "../utils/generateCompletionItems";

export class CompletionManager implements vscode.Disposable {
  completion: vscode.Disposable | undefined;
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

  dispose() {
    if (this.completion) this.completion.dispose();
  }
}
