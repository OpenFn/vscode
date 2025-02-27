import { execute } from "./execute";

export type Adaptor = {
  raw: string;
  name: string;
  version: string;
  full: string;
  refined: string;
};

const rE = /(\d+\.\d+\.\d+)/;
// TODO do some caching for version resolution
async function resolveAdaptor(adaptor: string): Promise<Adaptor> {
  let [name, version] = adaptor.split("@");
  if (!version || !rE.test(version)) {
    // get latest version
    version = await execute(`npm view @openfn/language-${name} version`);
    version = version.replace(/\n|\r|\t/g, "");
  }
  return {
    raw: adaptor,
    name,
    version,
    full: `${name}@${version}`,
    refined: `${name}_${version}`,
  };
}

export async function adaptorHelper(adaptors: string[]): Promise<Adaptor[]> {
  // sorting adaptors to always put collections last!
  const sortedAdaptors = adaptors.sort((a, b) =>
    /collections/.test(a) ? 1 : -1
  );
  return await Promise.all(sortedAdaptors.map(resolveAdaptor));
}
