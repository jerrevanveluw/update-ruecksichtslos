export type Reader = () => Promise<Package>;
export type Writer = (data: string) => void;
export type Executor = (name: string) => Promise<VersionDefs>;

export type Package = { dependencies: Dependencies; devDependencies: Dependencies };

export type Dependencies = { key: string; value: string };
export type VersionDef = readonly [string, string];
export type VersionDefs = readonly [string, string[]];

const read = (reader: Reader) => reader();

const checkVersion = (version: string | undefined) => version && Array.from(version.split('.').join('')).map(parseFloat).filter(Number.isNaN).length === 0;

const findLatestVersion = (versions: string[]): string => {
  const version = versions.pop();
  if (!version) throw Error();
  return checkVersion(version) ? version : findLatestVersion(versions);
};

const extractDeps = (dev: boolean) => ({ dependencies, devDependencies }: Package) => (dev ? devDependencies : dependencies);

const depsToEntries = (caret: boolean) => (executor: Executor) => (deps: Dependencies) => {
  const updatedDeps = Promise.all(Object.keys(deps).map(executor)).then(it => it.map(([name, versions]) => [name, findLatestVersion(versions)] as const).map(([name, version]) => [name, caret ? `^${version}` : version] as VersionDef));
  return deps ? updatedDeps : Promise.resolve([] as VersionDef[]);
};

const fromEntries = (versions: VersionDef[]) =>
  versions.reduce(
    (acc, cur) => ({
      ...acc,
      [cur[0]]: cur[1],
    }),
    {} as Dependencies,
  );

const compose = ([pack, dependencies, devDependencies]: [Package, Dependencies, Dependencies]): Package => ({
  ...pack,
  devDependencies,
  dependencies,
});

const stringify = (it: Package): string => `${JSON.stringify(it, null, 2)}\n`;

export const Update = (reader: Reader, executor: Executor, writer: Writer) => {
  const packageJson = read(reader);

  const deps = read(reader).then(extractDeps(false)).then(depsToEntries(false)(executor)).then(fromEntries);

  const devDeps = read(reader).then(extractDeps(true)).then(depsToEntries(true)(executor)).then(fromEntries);

  Promise.all([packageJson, deps, devDeps]).then(compose).then(stringify).then(writer);
};
