import { readFile, writeFile } from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
import { join } from 'path';
import { progressBar, Update } from './update-ruecksichtslos';
import { determinePrefix, encoding, npmViewPackageCommand, packageFile, parseWith } from './common';

const execute = promisify(exec);

const { argv, cwd, stdout } = process;
const { error, warn } = console;

const prefix = determinePrefix(argv, warn);

const packageJsonFile = join(cwd(), packageFile);

const decode = (buffer: Buffer) => buffer.toString(encoding);

const reader = () => readFile(packageJsonFile).then(decode).then(JSON.parse);

const executor = (name: string, currentVersion: string) =>
  execute(npmViewPackageCommand(name).join(' '))
    .then(({ stdout }: { stdout: string }): string => stdout)
    .then(parseWith(name, currentVersion));

const fileWriter = (data: string) => writeFile(packageJsonFile, data);
const stdoutWriter = (data: string) => stdout.write(data);

Update(reader, executor, fileWriter, progressBar(stdoutWriter), prefix).catch(error);
