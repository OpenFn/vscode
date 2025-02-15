import { existsSync, readFileSync } from "fs";
import { basename, dirname, join } from "path";

// where is the main root we want to get typescript from?
const rootFolder =
  basename(__dirname) === "dist"
    ? dirname(__dirname)
    : dirname(dirname(__dirname));

// narrowing to the installed typescript there
const TYPESCRIPT_LIB_SOURCE = join(rootFolder, "node_modules/typescript/lib");

export function loadLibrary(adaptors: string[], libs: string[]) {
  const mAdaptors = adaptors.map((adaptor) => ({
    refined: adaptor.replace("@", "_"),
    adaptor,
  }));
  const adaptorsMap = new Map();

  // path used here isn't fixed and has to be figured out
  mAdaptors.forEach((adaptor) =>
    adaptorsMap.set(
      adaptor.adaptor,
      `/tmp/openfn/repo/node_modules/@openfn/language-${adaptor.refined}/types`
    )
  );

  const globalExports: Record<string, boolean> = {};
  const namespaces: Record<string, string> = {};
  let activeSource: string = "";
  return function (name: string) {
    let isIndex = false;
    if (libs.includes(name)) activeSource = TYPESCRIPT_LIB_SOURCE;
    else if (adaptors.includes(name)) activeSource = adaptorsMap.get(name);
    let libPath, content;

    if (adaptors.includes(name)) {
      libPath = activeSource + "/index.d.ts";
      isIndex = true;
    } else if (/^node_modules\//.test(name)) {
      // FIXME: these are mostly libs that are referenced in the lib we want to load. currently not loading well.
      // we load from the local node_modules in this project. it rather want to load from where vscode keeps all installed extensions on disk
      libPath = join(rootFolder, name);
    } else libPath = activeSource + `/${name}`;
    if (!libPath) return "";
    try {
      content = readFileSync(libPath).toString();
      // if isIndex parse the code
      if (isIndex) {
        // parse the code here
        const globalMatches = content.matchAll(
          /export\s+\*\s+from\s+\"(.+)\"/g
        );
        const namespacedMatches = content.matchAll(
          /export\s+\*\s+as\s+(\w+)\s+from\s+\"(.+)\"/g
        );

        // track all global exports
        for (const gm of globalMatches) {
          const importFile = gm[1].replace("./", "") + ".d.ts";
          if (gm[1]) globalExports[importFile] = true;
        }

        // track all namespace exports
        for (const nm of namespacedMatches) {
          const nspace = nm[1];
          const importFile = nm[2].replace("./", "") + ".d.ts";
          if (nspace && importFile) namespaces[importFile] = nspace;
        }
      }

      // do which ever fits
      if (globalExports[name]) {
        content = `export {}; declare global { ${content} }`;
      } else if (namespaces[name]) {
        content = `export {}; declare global { export namespace ${namespaces[name]} { ${content} } }`;
      }
    } catch (e) {
      // `console`.log(`Unable to load library ${name} at ${libPath}`);
      content = "";
    }
    return content;
  };
}
