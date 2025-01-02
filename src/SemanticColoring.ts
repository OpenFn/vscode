import * as vscode from "vscode";

const HIGHLIGHT_KEYWORDS = ["state", "$"];

export default function registerSemanticColoring(api: typeof vscode) {
  const tokenTypes = ["openfn"];
  const tokenModifiers = ["state"];
  const legend = new api.SemanticTokensLegend(tokenTypes, tokenModifiers);

  const provider: vscode.DocumentSemanticTokensProvider = {
    provideDocumentSemanticTokens(
      document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.SemanticTokens> {
      const tokensBuilder = new api.SemanticTokensBuilder(legend);
      const lines = document.getText().split(/\r\n|\r|\n/);
      for (let ln = 0; ln < lines.length; ln++) {
        const line = lines[ln];
        for (const KEYWORD of HIGHLIGHT_KEYWORDS) {
          let idx = line.indexOf(KEYWORD);
          while (idx !== -1) {
            tokensBuilder.push(
              new api.Range(
                new api.Position(ln, idx),
                new api.Position(ln, idx + KEYWORD.length)
              ),
              "openfn",
              ["state"]
            );
            idx = line.indexOf(KEYWORD, idx + KEYWORD.length);
          }
        }
      }
      return tokensBuilder.build();
    },
  };

  const selector = { language: "fn", scheme: "file" };
  return api.languages.registerDocumentSemanticTokensProvider(
    selector,
    provider,
    legend
  );
}
