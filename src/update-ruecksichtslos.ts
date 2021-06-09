type SideEffect = () => void
type Sink = (data: string) => void

type Reader = () => Promise<Package>;
type FileWriter = Sink;
type StdoutWriter = Sink;
type Executor = (name: string) => Promise<VersionDefs>;

export type Package = { dependencies?: Dependencies; devDependencies?: Dependencies; peerDependencies?: Dependencies };

export type Dependencies = {
  [key: string]: string;
}

export type VersionDef = [string, string];
export type VersionDefs = readonly [string, string[]];

type Logger = Sink
type ProgressGenerator = Generator<string>
type ProgressBar = { start: SideEffect, log: Logger, end: SideEffect }

type Mapper = (p: Package) => Dependencies | undefined;
type Prefix = '^' | '~' | '';

type FromEntries = (entries: readonly [string, string][]) => { [k: string]: string };

class VersionError extends Error {
}

const checkVersion = (version: string | undefined) => version && Array.from(version.split('.').join('')).map(parseFloat).filter(Number.isNaN).length === 0;

const findLatestVersion = (versions: string[]): string => {
  const version = versions.pop();
  if (!version) throw new VersionError('No more versions to check...');
  return checkVersion(version) ? version : findLatestVersion(versions);
};

const compose = ([pack, dependencies, devDependencies, peerDependencies]: [Package, Dependencies, Dependencies, Dependencies]): Package => {
  if (pack.devDependencies && Object.keys(pack.devDependencies as {}).length === 0) delete pack.devDependencies;
  if (pack.dependencies && Object.keys(pack.dependencies as {}).length === 0) delete pack.dependencies;
  if (pack.peerDependencies && Object.keys(pack.peerDependencies as {}).length === 0) delete pack.peerDependencies;
  if (Object.keys(devDependencies).length > 0) pack.devDependencies = devDependencies;
  if (Object.keys(dependencies).length > 0) pack.dependencies = dependencies;
  if (Object.keys(peerDependencies).length > 0) pack.peerDependencies = peerDependencies;
  return pack;
};

const stringify = (it: Package): string => `${JSON.stringify(it, null, 2)}\n`;

const isFileRef = (s: string): boolean => s.includes('file:');

const fromEntries: FromEntries = entries => entries.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

const parallel = (executor: Executor, log: Logger) => (dependencies: string[]) => Promise.all(dependencies.map(name => executor(name).then(it => {
  log(name);
  return it;
})));

const exists = (d: Dependencies | undefined) => (d ? d : {});

const read = (reader: Reader, executor: Executor, mapper: Mapper, log: Logger, prefix: Prefix = '') => {
  const fileRefs: VersionDef[] = [];
  const alsoStoreFileRef = (entry: [string, string]): [string, string] => {
    if (isFileRef(entry[1])) fileRefs.push(entry);
    return entry;
  };
  return reader()
    .then(mapper)
    .then(exists)
    .then(Object.entries)
    .then(it => it.map(alsoStoreFileRef).filter(([_, value]) => !isFileRef(value)))
    .then(it => it.map(([key, _]) => key))
    .then(parallel(executor, log))
    .then(it => it.map(([name, versions]) => [name, findLatestVersion(versions)] as const))
    .then(it => it.map(([name, version]) => [name, `${prefix}${version}`] as VersionDef))
    .then(it => [...it, ...fileRefs])
    .then(it => it.sort())
    .then(fromEntries);
};

const combineDependencies = ({ dependencies, devDependencies, peerDependencies }: Package) => ({
  ...dependencies,
  ...devDependencies,
  ...peerDependencies,
});

export const progressBar = (writer: StdoutWriter) => (progressGenerator: ProgressGenerator): ProgressBar => {
  const spacer = ' '.repeat(30);
  const next = () => progressGenerator.next().value;
  const write = (addition: string) => writer(`${next()} ${addition}`);
  return {
    start: () => write('Reading'),
    log: (packageName: string) => write(`found versions for ${packageName}${spacer}`),
    end: () => write(`Done${spacer}\n`),
  };
};

export const Update = async (reader: Reader, executor: Executor, fileWriter: FileWriter, progressBarProvider: (p: ProgressGenerator) => ProgressBar, prefix: Prefix | null = null) => {
  const numberOfDeps = await reader().then(combineDependencies).then(Object.keys).then(it => it.length);

  const { start, log, end } = progressBarProvider(progressGenerator(numberOfDeps));

  start();

  const deps = read(reader, executor, ({ dependencies }) => dependencies, log, prefix ? prefix : '');

  const devDeps = read(reader, executor, ({ devDependencies }) => devDependencies, log, prefix ? prefix : '^');

  const peerDeps = read(reader, executor, ({ peerDependencies }) => peerDependencies, log, prefix ? prefix : '^');

  return await Promise.all([reader(), deps, devDeps, peerDeps])
    .then(compose)
    .then(stringify)
    .then(fileWriter)
    .finally(end);
};

function* progressGenerator(numberOfItems: number): ProgressGenerator {

  let i = 0;

  const width = 60;
  const progressBar = ' '.repeat(width).split('');
  const numberOfSteps = numberOfItems ;
  const barStep = Math.round(width / numberOfSteps);
  const percentageStep = Math.floor(100 / numberOfSteps);

  const bar = () => `\r[${progressBar.join('')}] ${percentageStep * i++}%`;

  const moveBar = () => {
    progressBar.splice(width - barStep, barStep);
    progressBar.unshift(...'.'.repeat(barStep).split(''));
  };

  yield bar();

  if (numberOfItems !== 0) {
    moveBar();
    while (i <= numberOfSteps) {
      yield bar();
      moveBar();
    }
  }

  yield `\r[${'.'.repeat(width)}] 100%`;
}
