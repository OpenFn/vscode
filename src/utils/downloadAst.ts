interface AdaptorInfo {
  name: string;
  version: string;
}

interface AstItem {
  docs: {
    description: string;
    tags: Array<{
      title: string;
      description: string;
      name: string;
      type: { name: string; type: string };
    }>;
  };
  name: string;
  params: string[];
  valid: boolean;
}

export interface AdaptorAst {
  common: Array<AstItem>;
  operations: Array<AstItem>;
}

const parseAdaptor = (adaptor: string): AdaptorInfo | null => {
  const regex = /^(?:languages-)?([\w-]+)@([\d.]+)$/;
  const match = adaptor.match(regex);

  if (match) {
    return {
      name: match[1],
      version: match[2],
    };
  } else {
    return null;
  }
};

const generateUrl = (info: AdaptorInfo) => {
  return `https://raw.githubusercontent.com/OpenFn/adaptors/refs/tags/@openfn/language-${info.name}@${info.version}/packages/${info.name}/ast.json`;
};

const download = (url: string) => {
  // do a local check for download
  return fetch(url).then((r) => r.text());
};

// TODO: very bad. don't cache in memory! on disk is better
const astStore: Record<string, AdaptorAst> = {};

export default async function downloadAst(
  specifier: string
): Promise<AdaptorAst | undefined> {
  let ast = astStore[specifier];
  if (ast) return ast;
  // takes versions and resolves @latest
  const parsed = parseAdaptor(specifier);
  if (!parsed) return undefined;
  const content = await download(generateUrl(parsed));
  astStore[specifier] = JSON.parse(content) as AdaptorAst;
  return astStore[specifier];
}
