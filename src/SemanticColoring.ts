import * as vscode from "vscode";

const HIGHLIGHT_KEYWORDS = ["state", "$"] as const;
const rETable: Record<(typeof HIGHLIGHT_KEYWORDS)[any], RegExp> = {
  $: /\$\.+/g,
  state: /((state)\.)|((state)\s*\=\s*>)|(return\s+(state))/g,
};

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
          let match = line.matchAll(rETable[KEYWORD]);
          if (match) {
            for (const m of match) {
              if (m[0] && m[0].includes("return"))
                m.index += m[0].indexOf("state");
              tokensBuilder.push(
                new api.Range(
                  new api.Position(ln, m.index),
                  new api.Position(ln, m.index + KEYWORD.length)
                ),
                "openfn",
                ["state"]
              );
            }
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
