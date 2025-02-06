import acorn from "acorn";
import * as recast from "recast";
import { namedTypes } from "ast-types";

// OPENFN COMPILER SHOULD ALLOW US TO TELL IT THE LEVEL OF HELP WE NEED FROM IT.
// IF SO, THEN WE CAN REUSE IT IN VSCODE WITHOUT THE TRANFORMATION STEP IT DOES YET.

type ParserResult =
  | { error: false; ast: namedTypes.File }
  | { error: true; startOffset: number; endOffset: number; message: string };

export default function parseSource(source: string): ParserResult {
  try {
    const ast = recast.parse(source, { parser: acorn });
    return { error: false, ast };
  } catch (e: any) {
    // TODO: check if .pos and .raisedAt exists first
    return {
      error: true,
      startOffset: e.pos,
      endOffset: e.raisedAt,
      message: e.message,
    };
  }
}
