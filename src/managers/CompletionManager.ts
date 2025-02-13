import * as vscode from "vscode";
import downloadAst from "../utils/downloadAst";
import generateCompletionItems from "../utils/generateCompletionItems";
import generateHoverItem from "../utils/generateHoverInformations";
import generateSignature from "../utils/generateSignature";
import { getTriggerFunction } from "../utils/getTriggerFunction";
import { tsCompleteHelp, tsHoverHelp } from "../compiler/tsLangSupport";

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
        provideCompletionItems: async (document, position, token, context) => {
          const adaptorCompletion = generateCompletionItems(ast);
          const tsCompletion = await tsCompleteHelp(
            document,
            position,
            context
          );
          return adaptorCompletion.concat(tsCompletion);
        },
      },
      "."
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
          return (
            generateHoverItem(ast, word) || tsHoverHelp(document, position)
          );
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
          const lineContent = document.lineAt(position.line).text;
          const pos = position.character - 1;
          const resp = getTriggerFunction(lineContent, pos); // pos should be on the trigger char

          const m = resp.content.match(/^([a-zA-Z_]\w*)\(?/); // TODO match nested function calls
          if (m && m[1]) return generateSignature(ast, m[1], resp.commas);
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
    if (this.hover) this.hover.dispose();
    if (this.signature) this.signature.dispose();
  }
}
