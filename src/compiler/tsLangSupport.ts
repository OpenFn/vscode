import * as ts from "typescript";
import {
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  Hover,
  MarkdownString,
  ParameterInformation,
  Position,
  SignatureHelp,
  SignatureInformation,
  SnippetString,
  TextDocument,
} from "vscode";
import { loadLibrary } from "./jsLibs";

function getlanguageServiceHost(document: TextDocument) {
  const compilerOptions: ts.CompilerOptions = {
    allowNonTsExtensions: true,
    allowJs: true,
    target: ts.ScriptTarget.Latest,
    lib: ["lib.es2020.full.d.ts"],
    moduleResolution: ts.ModuleResolutionKind.Classic,
    experimentalDecorators: false,
  };
  const host: ts.LanguageServiceHost = {
    getScriptKind: () => ts.ScriptKind.JS,
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => [document.uri.fsPath],
    getScriptVersion: function (fileName: string): string {
      if (fileName === document.uri.fsPath) {
        return String(document.version);
      }
      return "1";
    },
    getScriptSnapshot: function (
      fileName: string
    ): ts.IScriptSnapshot | undefined {
      let text = "";
      if (fileName === document.uri.fsPath) {
        text = document.getText();
      } else {
        text = loadLibrary(fileName);
      }
      return {
        getText: (start, end) => text.substring(start, end),
        getLength: () => text.length,
        getChangeRange: () => undefined,
      };
    },
    getCurrentDirectory: () => "",
    getDefaultLibFileName: (_options: ts.CompilerOptions) => "es2020.full",
    readFile: (
      path: string,
      _encoding?: string | undefined
    ): string | undefined => {
      if (path === document.uri.fsPath) {
        return document.getText();
      } else return loadLibrary(path);
    },
    fileExists: function (path: string): boolean {
      if (path === document.uri.fsPath) return true;
      return !!loadLibrary(path);
    },
  };
  return ts.createLanguageService(host);
}

export async function tsHoverHelp(
  document: TextDocument,
  position: Position
): Promise<Hover | null> {
  const jsLanguageService = await getlanguageServiceHost(document);
  const info = jsLanguageService.getQuickInfoAtPosition(
    document.uri.fsPath,
    document.offsetAt(position)
  );
  if (info) {
    const contents = ts.displayPartsToString(info.displayParts);
    const hoverInfo = new MarkdownString();
    hoverInfo.appendMarkdown(["```typescript", contents, "```"].join("\n"));
    return new Hover(hoverInfo);
  }
  return null;
}

export async function tsCompleteHelp(
  document: TextDocument,
  position: Position,
  _documentContext: CompletionContext
): Promise<CompletionItem[]> {
  const jsLanguageService = await getlanguageServiceHost(document);
  const offset = document.offsetAt(position);
  const completions = jsLanguageService.getCompletionsAtPosition(
    document.uri.fsPath,
    offset,
    { includeExternalModuleExports: false, includeInsertTextCompletions: false }
  );
  if (!completions) return [];
  return completions.entries.map((entry) => {
    // TODO: scriptKind to CompletionItemKind conversion
    const ci = new CompletionItem(entry.name, CompletionItemKind.Constant);
    ci.detail = entry.labelDetails?.detail;
    ci.documentation = entry.labelDetails?.description;
    ci.insertText = new SnippetString(entry.name);
    return ci;
  });
}

export async function tsSignatureHelp(
  document: TextDocument,
  position: Position
): Promise<SignatureHelp | null> {
  const jsLanguageService = await getlanguageServiceHost(document);
  const signHelp = jsLanguageService.getSignatureHelpItems(
    document.uri.fsPath,
    document.offsetAt(position),
    undefined
  );
  if (signHelp) {
    const ret: SignatureHelp = {
      activeSignature: signHelp.selectedItemIndex,
      activeParameter: signHelp.argumentIndex,
      signatures: [],
    };
    signHelp.items.forEach((item) => {
      const signature: SignatureInformation = {
        label: "",
        documentation: undefined,
        parameters: [],
      };

      signature.label += ts.displayPartsToString(item.prefixDisplayParts);
      item.parameters.forEach((p, i, a) => {
        const label = ts.displayPartsToString(p.displayParts);
        const parameter: ParameterInformation = {
          label: label,
          documentation: ts.displayPartsToString(p.documentation),
        };
        signature.label += label;
        signature.parameters!.push(parameter);
        if (i < a.length - 1) {
          signature.label += ts.displayPartsToString(
            item.separatorDisplayParts
          );
        }
      });
      signature.label += ts.displayPartsToString(item.suffixDisplayParts);
      ret.signatures.push(signature);
    });
    return ret;
  }
  return null;
}
