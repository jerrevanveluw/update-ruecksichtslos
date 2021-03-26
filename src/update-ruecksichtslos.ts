export type Reader = () => Promise<Package>;
export type Writer = (data: string) => void;
export type Executor = (name: string) => Promise<VersionDefs>;

export type Package = { dependencies?: Dependencies; devDependencies?: Dependencies; peerDependencies?: Dependencies };

export interface Dependencies {
  [key: string]: string;
}

export type VersionDef = [string, string];
export type VersionDefs = readonly [string, string[]];

type Mapper = (p: Package) => Dependencies | undefined;
type Prefix = '^' | '~' | '';

type FromEntries = (entries: readonly [string, string][]) => { [k: string]: string };

class VersionError extends Error {}

const checkVersion = (version: string | undefined) => version && Array.from(version.split('.').join('')).map(parseFloat).filter(Number.isNaN).length === 0;

const findLatestVersion = (versions: string[]): string => {
  const version = versions.pop();
  if (!version) throw new VersionError('No more versions to check...');
  return checkVersion(version) ? version : findLatestVersion(versions);
};

const compose = ([pack, dependencies, devDependencies, peerDependencies]: [Package, Dependencies, Dependencies, Dependencies]): Package => ({
  ...pack,
  devDependencies,
  dependencies,
  peerDependencies,
});

const stringify = (it: Package): string => `${JSON.stringify(it, null, 2)}\n`;

const isFileRef = (s: string): boolean => s.includes('file:');

const fromEntries: FromEntries = entries => entries.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

const read = (reader: Reader, executor: Executor, mapper: Mapper, prefix: Prefix = '') => {
  const fileRefs: VersionDef[] = [];
  const alsoStoreFileRef = (entry: [string, string]): [string, string] => {
    if (isFileRef(entry[1])) fileRefs.push(entry);
    return entry;
  };
  return reader()
    .then(mapper)
    .then(it => (it ? it : {}))
    .then(Object.entries)
    .then(it => it.map(alsoStoreFileRef).filter(([_, value]) => !isFileRef(value)))
    .then(it => it.map(([key, _]) => key))
    .then(it => Promise.all(it.map(executor)))
    .then(it => it.map(([name, versions]) => [name, findLatestVersion(versions)] as const))
    .then(it => it.map(([name, version]) => [name, `${prefix}${version}`] as VersionDef))
    .then(it => [...it, ...fileRefs])
    .then(fromEntries);
};

export const Update = (reader: Reader, executor: Executor, writer: Writer) => {
  const deps = read(reader, executor, ({ dependencies }) => dependencies);

  const devDeps = read(reader, executor, ({ devDependencies }) => devDependencies, '^');

  const peerDeps = read(reader, executor, ({ peerDependencies }) => peerDependencies, '~');

  return Promise.all([reader(), deps, devDeps, peerDeps]).then(compose).then(stringify).then(writer);
};
