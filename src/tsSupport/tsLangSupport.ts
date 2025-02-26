import { join } from "path";
import * as ts from "typescript";
import {
  CompletionItem,
  Definition,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  MarkdownString,
  ParameterInformation,
  Position,
  Range,
  SignatureHelp,
  SignatureInformation,
  SnippetString,
  TextDocument,
  Uri,
} from "vscode";
import { FnLangHost } from "../types";
import { Adaptor } from "../utils/adaptorHelper";
import { loadLibrary } from "./jsLibs";
import { convertKind } from "./kind";

export function getlanguageServiceHost(
  document: TextDocument,
  adaptors: Adaptor[]
) {
  const defaultLib = ["lib.es2020.d.ts", "openfn.lib"];
  const libLoader = loadLibrary(adaptors, defaultLib);
  const compilerOptions: ts.CompilerOptions = {
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    target: ts.ScriptTarget.Latest,
    lib: [...defaultLib, ...adaptors.map((a) => a.full)],
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
        text = libLoader.load(fileName);
      }
      return {
        getText: (start, end) => text.substring(start, end),
        getLength: () => text.length,
        getChangeRange: () => undefined,
      };
    },
    getCurrentDirectory: () => "",
    getDefaultLibFileName: (_options: ts.CompilerOptions) => "es2020",
    readFile: (
      path: string,
      _encoding?: string | undefined
    ): string | undefined => {
      if (path === document.uri.fsPath) {
        return document.getText();
      } else return libLoader.load(path);
    },
    fileExists: function (path: string): boolean {
      if (path === document.uri.fsPath) return true;
      return !!libLoader.load(path);
    },
  };
  return {
    service: ts.createLanguageService(host),
    adaptorPaths: libLoader.adaptorPaths,
  };
}

export async function tsHoverHelp(
  document: TextDocument,
  position: Position,
  fnHost: FnLangHost
): Promise<Hover | null> {
  const info = fnHost.service.getQuickInfoAtPosition(
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
  fnHost: FnLangHost
): Promise<CompletionItem[]> {
  const offset = document.offsetAt(position);
  const completions = fnHost.service.getCompletionsAtPosition(
    document.uri.fsPath,
    offset,
    { includeExternalModuleExports: false, includeInsertTextCompletions: false }
  );
  if (!completions) return [];
  return completions.entries.map((entry) => {
    // TODO: scriptKind to CompletionItemKind conversion
    const ci = new CompletionItem(entry.name, convertKind(entry.kind));
    ci.detail = entry.labelDetails?.detail;
    ci.documentation = entry.labelDetails?.description;
    ci.insertText = new SnippetString(entry.name);
    return ci;
  });
}

export async function tsSignatureHelp(
  document: TextDocument,
  position: Position,
  fnHost: FnLangHost
): Promise<SignatureHelp | null> {
  const signHelp = fnHost.service.getSignatureHelpItems(
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

export async function tsSyntacticDiagnostics(
  document: TextDocument,
  fnHost: FnLangHost
): Promise<Diagnostic[]> {
  // updateHostSettings(settings);

  const syntaxDiagnostics: ts.Diagnostic[] =
    fnHost.service.getSyntacticDiagnostics(document.uri.fsPath);
  const semanticDiagnostics = fnHost.service.getSemanticDiagnostics(
    document.uri.fsPath
  );
  return syntaxDiagnostics
    .concat(semanticDiagnostics)
    .filter((d) => ![2792].includes(d.code))
    .map((diag: ts.Diagnostic): Diagnostic => {
      return {
        range: convertRange(document, diag),
        severity: DiagnosticSeverity.Error,
        source: "fn",
        message: ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
      };
    });
}

export async function tsFindDefinition(
  document: TextDocument,
  position: Position,
  fnHost: FnLangHost
): Promise<Definition | null> {
  const definition = fnHost.service.getDefinitionAtPosition(
    document.uri.fsPath,
    document.offsetAt(position)
  );

  if (definition) {
    return definition
      .map((d) => {
        const isAdaptorType = d.fileName !== document.uri.fsPath;
        return {
          ...d,
          fileName: !isAdaptorType
            ? document.uri.fsPath
            : join(fnHost.adaptorPaths[0], d.fileName), // fix to search all adaptors
          isAdaptorType,
        };
      })
      .map((d) => {
        return {
          uri: Uri.parse(d.fileName),
          range: convertRange(document, d.textSpan), // TODO calculate range against adaptor type doc
        };
      });
  }
  return null;
}

function convertRange(
  document: TextDocument,
  span: { start: number | undefined; length: number | undefined }
): Range {
  if (typeof span.start === "undefined") {
    const pos = document.positionAt(0);
    return new Range(pos, pos);
  }
  const startPosition = document.positionAt(span.start);
  const endPosition = document.positionAt(span.start + (span.length || 0));
  return new Range(startPosition, endPosition);
}
