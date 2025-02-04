import * as vscode from "vscode";
import { namedTypes } from "ast-types";
import parseSource from "../compiler/parse";

function offsetToRange(offset: number, lens: number[]) {
  let c = 0;
  for (let i = 0; i < lens.length; i++) {
    const len = lens[i];
    if (c + len < offset) {
      c += len;
    } else {
      const col = offset - c;
      return { line: i, col };
    }
  }
  return undefined;
}

// deals with only the current open fn source code
export class SourceManager implements vscode.Disposable {
  ast: namedTypes.File | undefined;
  diagCollection: vscode.DiagnosticCollection;
  constructor() {
    this.diagCollection =
      vscode.languages.createDiagnosticCollection("fn-diagnostics");
  }

  // get the source document and update
  updateSource(document: vscode.TextDocument, uri: vscode.Uri) {
    const strSource = document.getText();
    const parseRes = parseSource(strSource);
    if (parseRes.error) {
      // FIXME: splitting by \n will split actual source \n.
      const lens = [];
      for (
        let i = 0;
        i < document.lineCount;
        i++ // funny enough. after split \n which is a character is lost. Hence we need to do +1 to length. don't know if that's true true
      )
        lens.push(document.lineAt(i).text.length + 1);
      const start = offsetToRange(parseRes.startOffset, lens);
      const end = offsetToRange(parseRes.endOffset, lens);
      if (!start || !end) return;
      // generate quiggly lines for this error!
      const syntaxE = new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(start.line, start.col),
          new vscode.Position(end.line, end.col)
        ),
        parseRes.message,
        vscode.DiagnosticSeverity.Error
      );
      this.diagCollection.set(uri, [syntaxE]);
    } else {
      this.diagCollection.set(uri, []);
    }
  }

  dispose() {}
}
