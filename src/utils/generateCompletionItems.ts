import { AdaptorAst } from "./downloadAst";
import * as vscode from "vscode";

export default function generateCompletionItems(ast: AdaptorAst) {
  const completionItems: vscode.CompletionItem[] = [];

  const all = ast.common.concat(ast.operations);
  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    const customCompletion = new vscode.CompletionItem(
      item.name,
      vscode.CompletionItemKind.Function
    );
    customCompletion.detail = item.docs.description;
    customCompletion;
    customCompletion.documentation = item.docs.description;
    customCompletion.insertText = new vscode.SnippetString(
      `${item.name}\${1:}`
    );
    completionItems.push(customCompletion);
  }
  return completionItems;
}
