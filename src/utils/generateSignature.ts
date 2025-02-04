import { AdaptorAst } from "./downloadAst";
import * as vscode from "vscode";

export default function generateSignature(ast: AdaptorAst, word: string) {
  const all = ast.common.concat(ast.operations);
  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    if (item.name === word) {
      const params = item.docs.tags.filter((t) => t.title === "param");
      const signatureHelp = new vscode.SignatureHelp();
      const signature = new vscode.SignatureInformation(
        `${item.name}(${params
          .map((p) => `${p.name}: ${p.type.name}`)
          .join(", ")})`,
        item.docs.description
      );

      signature.parameters = params.map(
        (p) =>
          new vscode.ParameterInformation(
            `${p.name}: ${p.type.name}`,
            p.description
          )
      );

      signatureHelp.signatures = [signature];
      signatureHelp.activeSignature = 0; //TODO: update with several definitions
      signature.activeParameter = 0; //TODO: when compiler is here. update active param
      return signatureHelp;
    }
  }
  return null;
}
