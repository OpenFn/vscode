import { AdaptorAst } from "./downloadAst";
import * as vscode from "vscode";

export default function generateHoverItem(ast: AdaptorAst, word: string) {
  const all = ast.common.concat(ast.operations);
  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    if (item.name === word)
      return new vscode.Hover({
        language: "fn",
        value: item.docs.description,
      });
  }
  return null;
}
