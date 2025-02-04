import { AdaptorAst } from "./downloadAst";
import * as vscode from "vscode";

export default function generateHoverItem(ast: AdaptorAst, word: string) {
  const all = ast.common.concat(ast.operations);
  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    if (item.name === word) {
      // TODO: find params & returns in a single loop!
      const params = item.docs.tags.filter((t) => t.title === "param");
      const returns = item.docs.tags.find((t) => t.title === "returns");
      const hoverInfo = new vscode.MarkdownString();
      hoverInfo.appendCodeblock(
        `(method) ${item.name}(${params
          .map((p) => `${p.name}: ${p.type.name}`)
          .join(", ")})${returns ? `: ${returns.type.name}` : ""}`,
        "fn"
      );
      hoverInfo.appendMarkdown("\n" + item.docs.description);
      return new vscode.Hover(hoverInfo);
    }
  }
  return null;
}
