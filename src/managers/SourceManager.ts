import * as vscode from "vscode";
import { tsSyntacticDiagnostics } from "../tsSupport/tsLangSupport";

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
    adaptor: string
  ) {
    const syntaxE = await tsSyntacticDiagnostics(document, adaptor);
    this.diagCollection.set(uri, syntaxE);
  }

  dispose() {}
}
