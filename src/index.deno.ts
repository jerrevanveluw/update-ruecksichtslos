import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { progressBar, Update } from './update-ruecksichtslos.ts';
import { determinePrefix, encoding, npmViewPackageCommand, packageFile, parseWith } from './common.ts';

const { args, cwd, readTextFile, run, stdout, writeTextFile } = Deno;
const { error, warn } = console;

const prefix = determinePrefix(args, warn);

const packageJsonFile = join(cwd(), packageFile);

const decode = (buffer: Uint8Array) => new TextDecoder(encoding).decode(buffer);

const encode = (string: string) => new TextEncoder().encode(string);

const reader = () => readTextFile(packageJsonFile).then(JSON.parse);

const executor = (name: string, currentVersion: string) =>
  run({ cmd: npmViewPackageCommand(name), stdout: 'piped', stderr: 'piped' })
    .output()
    .then(decode)
    .then(parseWith(name, currentVersion));

const fileWriter = (data: string) => writeTextFile(packageJsonFile, data);

const stdoutWriter = (data: string) => stdout.write(encode(data));

Update(reader, executor, fileWriter, progressBar(stdoutWriter), prefix).catch(error);
