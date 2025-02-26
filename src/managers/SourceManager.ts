import * as vscode from "vscode";
import { tsSyntacticDiagnostics } from "../tsSupport/tsLangSupport";
import { FnLangHost } from "../types";

// deals with only the current open fn source code
export class SourceManager implements vscode.Disposable {
  diagCollection: vscode.DiagnosticCollection;
  constructor() {
    this.diagCollection =
      vscode.languages.createDiagnosticCollection("fn-diagnostics");
  }

  // get the source document and update
  async updateSource(
    document: vscode.TextDocument,
    uri: vscode.Uri,
    fnHost: FnLangHost
  ) {
    const syntaxE = await tsSyntacticDiagnostics(document, fnHost);
    this.diagCollection.set(uri, syntaxE);
  }

  dispose() {}
}
