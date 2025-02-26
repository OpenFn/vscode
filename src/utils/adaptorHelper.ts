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
export async function adaptorHelper(adaptor: string): Promise<Adaptor> {
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
