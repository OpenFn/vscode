import { join, basename, dirname } from "path";
import { readFileSync } from "fs";

const contents: { [name: string]: string } = {};

// where is the main root we want to get typescript from?
const rootFolder =
  basename(__dirname) === "dist"
    ? dirname(__dirname)
    : dirname(dirname(__dirname));

// narrowing to the installed typescript there
const TYPESCRIPT_LIB_SOURCE = join(rootFolder, "node_modules/typescript/lib");

export function loadLibrary(name: string) {
  let content = contents[name];
  if (typeof content !== "string") {
    let libPath;

    if (/^node_modules\//.test(name)) {
      // FIXME: these are mostly libs that are referenced in the lib we want to load. currently not loading well.
      // we load from the local node_modules in this project. it rather want to load from where vscode keeps all installed extensions on disk
      libPath = join(rootFolder, name);
    } else {
      libPath = join(TYPESCRIPT_LIB_SOURCE, name);
    }
    try {
      content = readFileSync(libPath).toString();
    } catch (e) {
      console.log(`Unable to load library ${name} at ${libPath}`);
      content = "";
    }
    contents[name] = content;
  }
  return content;
}
